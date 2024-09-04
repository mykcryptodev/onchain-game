// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SnakeGame is Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;

    struct GameResult {
        address player;
        uint256 score;
        string ipfsCid;
        uint256 timestamp;
    }

    mapping(bytes32 => bool) public usedSignatures;
    mapping(address => GameResult) public playerBestScores;

    GameResult[LEADERBOARD_SIZE] private leaderboard;
    uint256 public leaderboardCount;
    mapping(address => uint256) private leaderboardPositions;

    event GameResultSubmitted(address indexed player, uint256 score, string ipfsCid, uint256 timestamp);
    event LeaderboardUpdated(address player, uint256 score);

    constructor(address msg.sender) {}

    /// @notice Submits a single game result to the contract
    /// @param player The address of the player
    /// @param score The player's score for this game
    /// @param ipfsCid The IPFS CID of the game replay
    /// @param timestamp The timestamp of when the game was played
    /// @param signature The signature from the game server to verify the result
    function submitGameResult(
        address player,
        uint256 score,
        string memory ipfsCid,
        uint256 timestamp,
        bytes memory signature
    ) external whenNotPaused nonReentrant onlyOwner {

        bytes32 messageHash = keccak256(abi.encodePacked(player, score, ipfsCid, timestamp));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == owner, "Invalid signature");
        require(!usedSignatures[ethSignedMessageHash], "Signature already used");
        
        usedSignatures[ethSignedMessageHash] = true;

        if (score > playerBestScores[player].score) {
            playerBestScores[player] = GameResult(player, score, ipfsCid, timestamp);
            updateLeaderboard(player, score, ipfsCid, timestamp);
        }

        emit GameResultSubmitted(player, score, ipfsCid, timestamp);
    }

    function updateLeaderboard(address player, uint256 score, string memory ipfsCid, uint256 timestamp) internal {
        uint256 position = LEADERBOARD_SIZE;
        
        // Check if player is already on the leaderboard
        if (leaderboardPositions[player] > 0) {
            position = leaderboardPositions[player] - 1;
            if (leaderboard[position].score >= score) {
                return; // No update needed
            }
        } else {
            // Find position for new score
            for (uint256 i = 0; i < leaderboardCount; i++) {
                if (score > leaderboard[i].score) {
                    position = i;
                    break;
                }
            }
        }

        // Only proceed if the score should be on the leaderboard
        if (position < LEADERBOARD_SIZE) {
            // Shift entries down
            for (uint256 i = min(leaderboardCount, LEADERBOARD_SIZE - 1); i > position; i--) {
                leaderboard[i] = leaderboard[i - 1];
                leaderboardPositions[leaderboard[i].player] = i + 1;
            }

            // Insert new score
            leaderboard[position] = GameResult(player, score, ipfsCid, timestamp);
            leaderboardPositions[player] = position + 1;

            // Update leaderboard count
            if (leaderboardCount < LEADERBOARD_SIZE) {
                leaderboardCount++;
            }

            emit LeaderboardUpdated(player, score);
        }
    }

    function min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    /// @notice Retrieves the current leaderboard
    /// @return An array of GameResult structs representing the leaderboard
    function getLeaderboard() public view returns (GameResult[] memory) {
        return leaderboard;
    }

    /// @notice Pauses the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Submits multiple game results in a single transaction
    /// @param players An array of player addresses
    /// @param scores An array of scores for each game
    /// @param ipfsCids An array of IPFS CIDs for each game replay
    /// @param timestamps An array of timestamps for each game
    /// @param signatures An array of signatures from the game server for each game
    function batchSubmitGameResults(
        address[] memory players,
        uint256[] memory scores,
        string[] memory ipfsCids,
        uint256[] memory timestamps,
        bytes[] memory signatures
    ) external whenNotPaused nonReentrant onlyOwner {
        require(players.length == scores.length && 
                scores.length == ipfsCids.length && 
                scores.length == timestamps.length && 
                scores.length == signatures.length, 
                "Input arrays must have the same length");

        for (uint256 i = 0; i < scores.length; i++) {
            bytes32 messageHash = keccak256(abi.encodePacked(players[i], scores[i], ipfsCids[i], timestamps[i]));
            bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
            
            address signer = ethSignedMessageHash.recover(signatures[i]);
            require(signer == owner, "Invalid signature");
            require(!usedSignatures[ethSignedMessageHash], "Signature already used");
            
            usedSignatures[ethSignedMessageHash] = true;

            if (scores[i] > playerBestScores[players[i]].score) {
                playerBestScores[players[i]] = GameResult(players[i], scores[i], ipfsCids[i], timestamps[i]);
                updateLeaderboard(players[i], scores[i], ipfsCids[i], timestamps[i]);
            }

            emit GameResultSubmitted(players[i], scores[i], ipfsCids[i], timestamps[i]);
        }
    }

    /// @notice Retrieves a player's best score
    /// @param player The address of the player
    /// @return A GameResult struct containing the player's best score information
    function getPlayerBestScore(address player) public view returns (GameResult memory) {
        return playerBestScores[player];
    }

    /// @notice Verifies a game result
    /// @param player The address of the player
    /// @param score The score to verify
    /// @param ipfsCid The IPFS CID of the game replay
    /// @param timestamp The timestamp of the game
    /// @param signature The signature from the game server
    /// @return A boolean indicating whether the game result is valid
    function verifyGameResult(
        address player,
        uint256 score,
        string memory ipfsCid,
        uint256 timestamp,
        bytes memory signature
    ) public view returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(player, score, ipfsCid, timestamp));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        return signer == owner;
    }
}