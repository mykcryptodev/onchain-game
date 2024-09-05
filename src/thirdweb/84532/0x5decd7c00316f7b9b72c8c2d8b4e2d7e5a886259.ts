import {
  type AbiParameterToPrimitiveType,
  type BaseTransactionOptions,
  prepareContractCall,
  prepareEvent,
  readContract,
} from "thirdweb";

/**
* Contract events
*/

/**
 * Represents the filters for the "GameResultSubmitted" event.
 */
export type GameResultSubmittedEventFilters = Partial<{
  player: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"player","type":"address"}>
}>;

/**
 * Creates an event object for the GameResultSubmitted event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { gameResultSubmittedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  gameResultSubmittedEvent({
 *  player: ...,
 * })
 * ],
 * });
 * ```
 */
export function gameResultSubmittedEvent(filters: GameResultSubmittedEventFilters = {}) {
  return prepareEvent({
    signature: "event GameResultSubmitted(address indexed player, uint256 score, string ipfsCid, uint256 timestamp)",
    filters,
  });
};
  



/**
 * Creates an event object for the LeaderboardUpdated event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { leaderboardUpdatedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  leaderboardUpdatedEvent()
 * ],
 * });
 * ```
 */
export function leaderboardUpdatedEvent() {
  return prepareEvent({
    signature: "event LeaderboardUpdated(address player, uint256 score)",
  });
};
  

/**
 * Represents the filters for the "OwnershipTransferred" event.
 */
export type OwnershipTransferredEventFilters = Partial<{
  previousOwner: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"}>
newOwner: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}>
}>;

/**
 * Creates an event object for the OwnershipTransferred event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { ownershipTransferredEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  ownershipTransferredEvent({
 *  previousOwner: ...,
 *  newOwner: ...,
 * })
 * ],
 * });
 * ```
 */
export function ownershipTransferredEvent(filters: OwnershipTransferredEventFilters = {}) {
  return prepareEvent({
    signature: "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
    filters,
  });
};
  



/**
 * Creates an event object for the Paused event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { pausedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  pausedEvent()
 * ],
 * });
 * ```
 */
export function pausedEvent() {
  return prepareEvent({
    signature: "event Paused(address account)",
  });
};
  



/**
 * Creates an event object for the Unpaused event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { unpausedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  unpausedEvent()
 * ],
 * });
 * ```
 */
export function unpausedEvent() {
  return prepareEvent({
    signature: "event Unpaused(address account)",
  });
};
  

/**
* Contract read functions
*/



/**
 * Calls the "LEADERBOARD_SIZE" function on the contract.
 * @param options - The options for the LEADERBOARD_SIZE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { LEADERBOARD_SIZE } from "TODO";
 *
 * const result = await LEADERBOARD_SIZE();
 *
 * ```
 */
export async function LEADERBOARD_SIZE(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x4f085f42",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "getLeaderboard" function on the contract.
 * @param options - The options for the getLeaderboard function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getLeaderboard } from "TODO";
 *
 * const result = await getLeaderboard();
 *
 * ```
 */
export async function getLeaderboard(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x6d763a6e",
  [],
  [
    {
      "components": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "score",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "ipfsCid",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "internalType": "struct GameResult[10]",
      "name": "",
      "type": "tuple[10]"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "getPlayerBestScore" function.
 */
export type GetPlayerBestScoreParams = {
  player: AbiParameterToPrimitiveType<{"internalType":"address","name":"player","type":"address"}>
};

/**
 * Calls the "getPlayerBestScore" function on the contract.
 * @param options - The options for the getPlayerBestScore function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getPlayerBestScore } from "TODO";
 *
 * const result = await getPlayerBestScore({
 *  player: ...,
 * });
 *
 * ```
 */
export async function getPlayerBestScore(
  options: BaseTransactionOptions<GetPlayerBestScoreParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xcd382680",
  [
    {
      "internalType": "address",
      "name": "player",
      "type": "address"
    }
  ],
  [
    {
      "components": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "score",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "ipfsCid",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "internalType": "struct GameResult",
      "name": "",
      "type": "tuple"
    }
  ]
],
    params: [options.player]
  });
};




/**
 * Calls the "leaderboardCount" function on the contract.
 * @param options - The options for the leaderboardCount function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { leaderboardCount } from "TODO";
 *
 * const result = await leaderboardCount();
 *
 * ```
 */
export async function leaderboardCount(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x48815a57",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "owner" function on the contract.
 * @param options - The options for the owner function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { owner } from "TODO";
 *
 * const result = await owner();
 *
 * ```
 */
export async function owner(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x8da5cb5b",
  [],
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "paused" function on the contract.
 * @param options - The options for the paused function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { paused } from "TODO";
 *
 * const result = await paused();
 *
 * ```
 */
export async function paused(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x5c975abb",
  [],
  [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "playerBestScores" function.
 */
export type PlayerBestScoresParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"address","name":"","type":"address"}>
};

/**
 * Calls the "playerBestScores" function on the contract.
 * @param options - The options for the playerBestScores function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { playerBestScores } from "TODO";
 *
 * const result = await playerBestScores({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function playerBestScores(
  options: BaseTransactionOptions<PlayerBestScoresParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x0f42afed",
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ],
  [
    {
      "internalType": "address",
      "name": "player",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "score",
      "type": "uint256"
    },
    {
      "internalType": "string",
      "name": "ipfsCid",
      "type": "string"
    },
    {
      "internalType": "uint256",
      "name": "timestamp",
      "type": "uint256"
    }
  ]
],
    params: [options.arg_0]
  });
};


/**
* Contract write functions
*/



/**
 * Calls the "pause" function on the contract.
 * @param options - The options for the "pause" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { pause } from "TODO";
 *
 * const transaction = pause();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function pause(
  options: BaseTransactionOptions
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x8456cb59",
  [],
  []
],
    params: []
  });
};




/**
 * Calls the "renounceOwnership" function on the contract.
 * @param options - The options for the "renounceOwnership" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { renounceOwnership } from "TODO";
 *
 * const transaction = renounceOwnership();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function renounceOwnership(
  options: BaseTransactionOptions
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x715018a6",
  [],
  []
],
    params: []
  });
};


/**
 * Represents the parameters for the "submitGameResult" function.
 */
export type SubmitGameResultParams = {
  player: AbiParameterToPrimitiveType<{"internalType":"address","name":"player","type":"address"}>
score: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"score","type":"uint256"}>
ipfsCid: AbiParameterToPrimitiveType<{"internalType":"string","name":"ipfsCid","type":"string"}>
timestamp: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"timestamp","type":"uint256"}>
};

/**
 * Calls the "submitGameResult" function on the contract.
 * @param options - The options for the "submitGameResult" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { submitGameResult } from "TODO";
 *
 * const transaction = submitGameResult({
 *  player: ...,
 *  score: ...,
 *  ipfsCid: ...,
 *  timestamp: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function submitGameResult(
  options: BaseTransactionOptions<SubmitGameResultParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xf82815c3",
  [
    {
      "internalType": "address",
      "name": "player",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "score",
      "type": "uint256"
    },
    {
      "internalType": "string",
      "name": "ipfsCid",
      "type": "string"
    },
    {
      "internalType": "uint256",
      "name": "timestamp",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.player, options.score, options.ipfsCid, options.timestamp]
  });
};


/**
 * Represents the parameters for the "transferOwnership" function.
 */
export type TransferOwnershipParams = {
  newOwner: AbiParameterToPrimitiveType<{"internalType":"address","name":"newOwner","type":"address"}>
};

/**
 * Calls the "transferOwnership" function on the contract.
 * @param options - The options for the "transferOwnership" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { transferOwnership } from "TODO";
 *
 * const transaction = transferOwnership({
 *  newOwner: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function transferOwnership(
  options: BaseTransactionOptions<TransferOwnershipParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xf2fde38b",
  [
    {
      "internalType": "address",
      "name": "newOwner",
      "type": "address"
    }
  ],
  []
],
    params: [options.newOwner]
  });
};




/**
 * Calls the "unpause" function on the contract.
 * @param options - The options for the "unpause" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { unpause } from "TODO";
 *
 * const transaction = unpause();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function unpause(
  options: BaseTransactionOptions
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x3f4ba83a",
  [],
  []
],
    params: []
  });
};


