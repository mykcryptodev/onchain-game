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

    address public gameServerPublicKey;
    uint256 public challengePeriod = 1 days;

    GameResult[] public leaderboard;
    uint256 public constant LEADERBOARD_SIZE = 10;

    event GameResultSubmitted(address indexed player, uint256 score, string ipfsCid, uint256 timestamp);
    event PublicKeyUpdated(address newPublicKey);
    event ChallengePeriodUpdated(uint256 newPeriod);
    event LeaderboardUpdated(address player, uint256 score);

    constructor(address initialGameServerPublicKey) {
        gameServerPublicKey = initialGameServerPublicKey;
    }

    /// @notice Submits a single game result to the contract
    /// @param score The player's score for this game
    /// @param ipfsCid The IPFS CID of the game replay
    /// @param timestamp The timestamp of when the game was played
    /// @param signature The signature from the game server to verify the result
    function submitGameResult(
        uint256 score,
        string memory ipfsCid,
        uint256 timestamp,
        bytes memory signature
    ) external whenNotPaused nonReentrant {
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, score, ipfsCid, timestamp));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == gameServerPublicKey, "Invalid signature");
        require(!usedSignatures[ethSignedMessageHash], "Signature already used");
        
        usedSignatures[ethSignedMessageHash] = true;

        if (score > playerBestScores[msg.sender].score) {
            playerBestScores[msg.sender] = GameResult(msg.sender, score, ipfsCid, timestamp);
            updateLeaderboard(msg.sender, score, ipfsCid, timestamp);
        }

        emit GameResultSubmitted(msg.sender, score, ipfsCid, timestamp);
    }

    function updateLeaderboard(address player, uint256 score, string memory ipfsCid, uint256 timestamp) internal {
        uint256 position = leaderboard.length;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (score > leaderboard[i].score) {
                position = i;
                break;
            }
        }
        
        if (position < LEADERBOARD_SIZE) {
            if (leaderboard.length < LEADERBOARD_SIZE) {
                leaderboard.push(GameResult(player, score, ipfsCid, timestamp));
            } else {
                leaderboard[LEADERBOARD_SIZE - 1] = GameResult(player, score, ipfsCid, timestamp);
            }
            
            for (uint256 i = position; i < leaderboard.length - 1 && i < LEADERBOARD_SIZE - 1; i++) {
                GameResult memory temp = leaderboard[i];
                leaderboard[i] = leaderboard[i + 1];
                leaderboard[i + 1] = temp;
            }
            
            emit LeaderboardUpdated(player, score);
        }
    }

    /// @notice Retrieves the current leaderboard
    /// @return An array of GameResult structs representing the leaderboard
    function getLeaderboard() public view returns (GameResult[] memory) {
        return leaderboard;
    }

    /// @notice Updates the game server's public key
    /// @param newPublicKey The new public key to be set
    function updateGameServerPublicKey(address newPublicKey) external onlyOwner {
        gameServerPublicKey = newPublicKey;
        emit PublicKeyUpdated(newPublicKey);
    }

    /// @notice Sets a new challenge period
    /// @param newPeriod The new challenge period duration in seconds
    function setChallengePeriod(uint256 newPeriod) external onlyOwner {
        challengePeriod = newPeriod;
        emit ChallengePeriodUpdated(newPeriod);
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
    /// @param scores An array of scores for each game
    /// @param ipfsCids An array of IPFS CIDs for each game replay
    /// @param timestamps An array of timestamps for each game
    /// @param signatures An array of signatures from the game server for each game
    function batchSubmitGameResults(
        uint256[] memory scores,
        string[] memory ipfsCids,
        uint256[] memory timestamps,
        bytes[] memory signatures
    ) external whenNotPaused nonReentrant {
        require(scores.length == ipfsCids.length && 
                scores.length == timestamps.length && 
                scores.length == signatures.length, 
                "Input arrays must have the same length");

        for (uint256 i = 0; i < scores.length; i++) {
            bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, scores[i], ipfsCids[i], timestamps[i]));
            bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
            
            address signer = ethSignedMessageHash.recover(signatures[i]);
            require(signer == gameServerPublicKey, "Invalid signature");
            require(!usedSignatures[ethSignedMessageHash], "Signature already used");
            
            usedSignatures[ethSignedMessageHash] = true;

            if (scores[i] > playerBestScores[msg.sender].score) {
                playerBestScores[msg.sender] = GameResult(msg.sender, scores[i], ipfsCids[i], timestamps[i]);
                updateLeaderboard(msg.sender, scores[i], ipfsCids[i], timestamps[i]);
            }

            emit GameResultSubmitted(msg.sender, scores[i], ipfsCids[i], timestamps[i]);
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
        return signer == gameServerPublicKey;
    }
}