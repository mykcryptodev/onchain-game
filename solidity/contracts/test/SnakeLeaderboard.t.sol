// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SnakeLeaderboard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
contract SnakeGameTest is Test {
    SnakeGame public game;
    address public owner;
    address public player1;
    address public player2;
    uint256 public ownerPrivateKey;

    function setUp() public {
        ownerPrivateKey = 0x1234; // Use a fixed private key for consistency
        owner = vm.addr(ownerPrivateKey);
        game = new SnakeGame();
        vm.prank(address(this));
        game.transferOwnership(owner); // Transfer ownership to the generated owner address
        player1 = address(0x1);
        player2 = address(0x2);
    }

    function testSubmitGameResult() public {
        uint256 score = 100;
        string memory ipfsCid = "QmTest";
        uint256 timestamp = block.timestamp;

        bytes32 messageHash = keccak256(abi.encodePacked(player1, score, ipfsCid, timestamp));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(owner);
        game.submitGameResult(player1, score, ipfsCid, timestamp, signature);

        GameResult memory result = game.getPlayerBestScore(player1);
        assertEq(result.player, player1);
        assertEq(result.score, score);
        assertEq(result.ipfsCid, ipfsCid);
        assertEq(result.timestamp, timestamp);
    }

    function testBatchSubmitGameResults() public {
        address[] memory players = new address[](2);
        players[0] = player1;
        players[1] = player2;

        uint256[] memory scores = new uint256[](2);
        scores[0] = 100;
        scores[1] = 200;

        string[] memory ipfsCids = new string[](2);
        ipfsCids[0] = "QmTest1";
        ipfsCids[1] = "QmTest2";

        uint256[] memory timestamps = new uint256[](2);
        timestamps[0] = block.timestamp;
        timestamps[1] = block.timestamp + 1;

        bytes[] memory signatures = new bytes[](2);

        for (uint256 i = 0; i < 2; i++) {
            bytes32 messageHash = keccak256(abi.encodePacked(players[i], scores[i], ipfsCids[i], timestamps[i]));
            bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
            signatures[i] = abi.encodePacked(r, s, v);
        }
        vm.prank(owner);
        game.batchSubmitGameResults(players, scores, ipfsCids, timestamps, signatures);

        GameResult memory result1 = game.getPlayerBestScore(player1);
        assertEq(result1.score, 100);

        GameResult memory result2 = game.getPlayerBestScore(player2);
        assertEq(result2.score, 200);
    }

    function testUpdateLeaderboard() public {
        // Submit multiple game results to fill the leaderboard
        for (uint256 i = 1; i <= 15; i++) {
            address player = address(uint160(i));
            uint256 score = i * 100;
            string memory ipfsCid = string(abi.encodePacked("QmTest", vm.toString(i)));
            uint256 timestamp = block.timestamp + i;

            bytes32 messageHash = keccak256(abi.encodePacked(player, score, ipfsCid, timestamp));
            bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
            bytes memory signature = abi.encodePacked(r, s, v);

            vm.prank(owner);
            game.submitGameResult(player, score, ipfsCid, timestamp, signature);

            // After each submission, check the player's best score and the leaderboard
            GameResult memory playerBestScore = game.getPlayerBestScore(player);
            console.log("Player %s best score: %d", player, playerBestScore.score);

            GameResult[10] memory leaderboard = game.getLeaderboard();
            console.log("Leaderboard after submitting score %d:", score);
            for (uint j = 0; j < 10; j++) {
                console.log("Position %d: Player %s, Score %d", j + 1, leaderboard[j].player, leaderboard[j].score);
            }
            console.log("---");
        }

        // Final leaderboard check
        GameResult[10] memory finalLeaderboard = game.getLeaderboard();
        console.log("Final Leaderboard:");
        for (uint i = 0; i < 10; i++) {
            console.log("Position %d: Player %s, Score %d", i + 1, finalLeaderboard[i].player, finalLeaderboard[i].score);
        }
        
        // Check if the leaderboard is sorted and contains the top 10 scores
        for (uint256 i = 0; i < 10; i++) {
            assertEq(finalLeaderboard[i].score, (15 - i) * 100);
        }
    }

    function testPauseAndUnpause() public {
        vm.prank(owner);
        game.pause();
        assertTrue(game.paused());

        vm.prank(owner);
        game.unpause();
        assertFalse(game.paused());
    }

    function testVerifyGameResult() public {
        uint256 score = 100;
        string memory ipfsCid = "QmTest";
        uint256 timestamp = block.timestamp;

        bytes32 messageHash = keccak256(abi.encodePacked(player1, score, ipfsCid, timestamp));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        bool isValid = game.verifyGameResult(player1, score, ipfsCid, timestamp, signature);
        assertTrue(isValid);

        // Test with invalid signature
        (v, r, s) = vm.sign(uint256(keccak256(abi.encodePacked("not_owner"))), ethSignedMessageHash);
        bytes memory invalidSignature = abi.encodePacked(r, s, v);

        isValid = game.verifyGameResult(player1, score, ipfsCid, timestamp, invalidSignature);
        assertFalse(isValid);
    }

    function testOnlyOwnerCanSubmit() public {
        uint256 score = 100;
        string memory ipfsCid = "QmTest";
        uint256 timestamp = block.timestamp;

        bytes32 messageHash = keccak256(abi.encodePacked(player1, score, ipfsCid, timestamp));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(player1);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, player1));
        game.submitGameResult(player1, score, ipfsCid, timestamp, signature);
    }

    function testGetPlayerBestScore() public {
        address player = address(0x1);
        uint256 score = 100;
        string memory ipfsCid = "QmTest";
        uint256 timestamp = block.timestamp;

        bytes32 messageHash = keccak256(abi.encodePacked(player, score, ipfsCid, timestamp));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(owner);
        game.submitGameResult(player, score, ipfsCid, timestamp, signature);

        GameResult memory result = game.getPlayerBestScore(player);
        assertEq(result.player, player);
        assertEq(result.score, score);
        assertEq(result.ipfsCid, ipfsCid);
        assertEq(result.timestamp, timestamp);

        console.log("Player %s best score: %d", player, result.score);
    }

    function testUpdateLeaderboardWithHigherScore() public {
        // Submit initial score for player1
        uint256 initialScore = 100;
        submitGameResult(player1, initialScore);

        GameResult memory result = game.getPlayerBestScore(player1);
        assertEq(result.score, initialScore);

        // Submit higher score for player1
        uint256 higherScore = 200;
        submitGameResult(player1, higherScore);

        result = game.getPlayerBestScore(player1);
        assertEq(result.score, higherScore);

        // Check leaderboard
        GameResult[10] memory leaderboard = game.getLeaderboard();
        assertEq(leaderboard[0].player, player1);
        assertEq(leaderboard[0].score, higherScore);
    }

    function testUpdateLeaderboardWithLowerScore() public {
        // Submit initial score for player1
        uint256 initialScore = 200;
        submitGameResult(player1, initialScore);

        GameResult memory result = game.getPlayerBestScore(player1);
        assertEq(result.score, initialScore);

        // Submit lower score for player1
        uint256 lowerScore = 100;
        submitGameResult(player1, lowerScore);

        result = game.getPlayerBestScore(player1);
        assertEq(result.score, initialScore);

        // Check leaderboard
        GameResult[10] memory leaderboard = game.getLeaderboard();
        assertEq(leaderboard[0].player, player1);
        assertEq(leaderboard[0].score, initialScore);
    }

    function testLeaderboardOrderWithMultiplePlayers() public {
        // Submit scores for player1 and player2
        submitGameResult(player1, 100);
        submitGameResult(player2, 200);

        GameResult[10] memory leaderboard = game.getLeaderboard();
        assertEq(leaderboard[0].player, player2);
        assertEq(leaderboard[0].score, 200);
        assertEq(leaderboard[1].player, player1);
        assertEq(leaderboard[1].score, 100);

        // Player1 submits a new high score
        submitGameResult(player1, 300);

        leaderboard = game.getLeaderboard();
        assertEq(leaderboard[0].player, player1);
        assertEq(leaderboard[0].score, 300);
        assertEq(leaderboard[1].player, player2);
        assertEq(leaderboard[1].score, 200);
        // check that player1's old score is not on the leaderboard
        assertEq(leaderboard[2].player, address(0));
        assertEq(leaderboard[2].score, 0);
    }

    // Helper function to submit a game result
    function submitGameResult(address player, uint256 score) internal {
        string memory ipfsCid = "QmTest";
        uint256 timestamp = block.timestamp;

        bytes32 messageHash = keccak256(abi.encodePacked(player, score, ipfsCid, timestamp));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(owner);
        game.submitGameResult(player, score, ipfsCid, timestamp, signature);
    }
}
