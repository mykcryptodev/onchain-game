// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SnakeLeaderboard.sol";

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

        SnakeGame.GameResult memory result = game.getPlayerBestScore(player1);
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
            bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(keccak256(abi.encodePacked("owner"))), ethSignedMessageHash);
            signatures[i] = abi.encodePacked(r, s, v);
        }
        vm.prank(owner);
        game.batchSubmitGameResults(players, scores, ipfsCids, timestamps, signatures);

        SnakeGame.GameResult memory result1 = game.getPlayerBestScore(player1);
        assertEq(result1.score, 100);

        SnakeGame.GameResult memory result2 = game.getPlayerBestScore(player2);
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
            bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(keccak256(abi.encodePacked("owner"))), ethSignedMessageHash);
            bytes memory signature = abi.encodePacked(r, s, v);

            game.submitGameResult(player, score, ipfsCid, timestamp, signature);
        }

        SnakeGame.GameResult[10] memory leaderboard = game.getLeaderboard();
        
        // Check if the leaderboard is sorted and contains the top 10 scores
        for (uint256 i = 0; i < 10; i++) {
            assertEq(leaderboard[i].score, (15 - i) * 100);
        }
    }

    function testPauseAndUnpause() public {
        game.pause();
        assertTrue(game.paused());

        vm.expectRevert("Pausable: paused");
        testSubmitGameResult();

        game.unpause();
        assertFalse(game.paused());

        testSubmitGameResult();
    }

    function testVerifyGameResult() public {
        uint256 score = 100;
        string memory ipfsCid = "QmTest";
        uint256 timestamp = block.timestamp;

        bytes32 messageHash = keccak256(abi.encodePacked(player1, score, ipfsCid, timestamp));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(keccak256(abi.encodePacked("owner"))), ethSignedMessageHash);
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
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(keccak256(abi.encodePacked("owner"))), ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(player1);
        vm.expectRevert("Ownable: caller is not the owner");
        game.submitGameResult(player1, score, ipfsCid, timestamp, signature);
    }
}
