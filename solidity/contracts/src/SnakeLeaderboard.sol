// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

struct GameResult {
        address player;
        uint256 score;
        string ipfsCid;
        uint256 timestamp;
    }

contract SnakeGame is Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;
    

    uint256 public constant LEADERBOARD_SIZE = 10;

    mapping(address => GameResult) public playerBestScores;

    GameResult[LEADERBOARD_SIZE] private leaderboard;
    uint256 public leaderboardCount;
    mapping(address => uint256) private leaderboardPositions;

    event GameResultSubmitted(address indexed player, uint256 score, string ipfsCid, uint256 timestamp);
    event LeaderboardUpdated(address player, uint256 score);

    constructor() Ownable(msg.sender) {}

    /// @notice Submits a single game result to the contract
    /// @param player The address of the player
    /// @param score The player's score for this game
    /// @param ipfsCid The IPFS CID of the game replay
    /// @param timestamp The timestamp of when the game was played
    function submitGameResult(
        address player,
        uint256 score,
        string memory ipfsCid,
        uint256 timestamp
    ) external whenNotPaused nonReentrant onlyOwner {
        require(player != address(0), "Invalid player address");
        require(score > 0, "Invalid score");
        require(bytes(ipfsCid).length > 0, "Invalid IPFS CID");
        require(timestamp > 0, "Invalid timestamp");

        if (score > playerBestScores[player].score) {
            playerBestScores[player] = GameResult(player, score, ipfsCid, timestamp);
            updateLeaderboard(player, score, ipfsCid, timestamp);
        }

        emit GameResultSubmitted(player, score, ipfsCid, timestamp);
    }

    function updateLeaderboard(address player, uint256 score, string memory ipfsCid, uint256 timestamp) internal {
        uint256 oldPosition = LEADERBOARD_SIZE;
        uint256 newPosition = LEADERBOARD_SIZE;
        
        // Check if player is already on the leaderboard
        if (leaderboardPositions[player] > 0) {
            oldPosition = leaderboardPositions[player] - 1;
            if (leaderboard[oldPosition].score >= score) {
                return; // No update needed
            }
        }

        // Find the correct position for the new score
        for (uint256 i = 0; i < leaderboardCount; i++) {
            if (score > leaderboard[i].score) {
                newPosition = i;
                break;
            }
        }

        // If the leaderboard isn't full, use the next available position
        if (newPosition == LEADERBOARD_SIZE && leaderboardCount < LEADERBOARD_SIZE) {
            newPosition = leaderboardCount;
        }

        // Only proceed if the score should be on the leaderboard
        if (newPosition < LEADERBOARD_SIZE) {
            // Remove the old score if it exists
            if (oldPosition < LEADERBOARD_SIZE) {
                for (uint256 i = oldPosition; i < leaderboardCount - 1; i++) {
                    leaderboard[i] = leaderboard[i + 1];
                    leaderboardPositions[leaderboard[i].player] = i + 1;
                }
                if (leaderboardCount > 0) {
                    leaderboardCount--;
                }
            }

            // Shift entries down
            for (uint256 i = min(leaderboardCount, LEADERBOARD_SIZE - 1); i > newPosition; i--) {
                leaderboard[i] = leaderboard[i - 1];
                leaderboardPositions[leaderboard[i].player] = i + 1;
            }

            // Insert new score
            leaderboard[newPosition] = GameResult(player, score, ipfsCid, timestamp);
            leaderboardPositions[player] = newPosition + 1;

            // Update leaderboard count
            if (leaderboardCount < LEADERBOARD_SIZE) {
                leaderboardCount++;
            }

            emit LeaderboardUpdated(player, score);
        }
    }

    // Helper function to get the minimum of two uint256 values
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /// @notice Retrieves the current leaderboard
    /// @return An array of GameResult structs representing the leaderboard
    function getLeaderboard() public view returns (GameResult[LEADERBOARD_SIZE] memory) {
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

    /// @notice Retrieves a player's best score
    /// @param player The address of the player
    /// @return A GameResult struct containing the player's best score information
    function getPlayerBestScore(address player) public view returns (GameResult memory) {
        return playerBestScores[player];
    }

}