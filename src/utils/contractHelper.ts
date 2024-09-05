import { ethers } from 'ethers'

import SnakeGameABI from '~/contract/SnakeContract.json'
import { env } from '~/env.js'

// Use optional chaining to handle potential undefined values
const provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL)
const signer = new ethers.Wallet(env.BASE_PRIVATE_KEY, provider)

const contractAddress = env.SNAKE_GAME_CONTRACT_ADDRESS_BASE ?? ''
const contract = new ethers.Contract(contractAddress, SnakeGameABI, signer)

type ActionResponse<T = unknown> = {
    data?: T        // Holds the successful result, if any
    error?: string  // Contains an error message, if an error occurred
  }

export async function submitGameResult({
  player,
  score,
  ipfsCid,
  timestamp
}: {
  player: string
  score: number
  ipfsCid: string
  timestamp: number
}): Promise<ActionResponse<ethers.TransactionResponse>> {
  try {
    if (!player || !ipfsCid) {
      return { error: 'Invalid input: player and ipfsCid are required' }
    }

    const tx = await contract.submitGameResult(player, score, ipfsCid, timestamp)
    return { data: tx }
  } catch (error) {
    console.error('Error submitting game result:', error)
    return { error: 'Failed to submit game result to the blockchain' }
  }
}