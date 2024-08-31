import { 
  arbitrum, 
  avalanche, 
  base, 
  baseSepolia, 
  mainnet,
  optimism,
  polygon,
} from "wagmi/chains";

type ContractAddress = Record<number, `0x${string}`>;

export const USDC: ContractAddress = {
  [arbitrum.id]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  [avalanche.id]: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  [baseSepolia.id]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  [mainnet.id]: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  [optimism.id]: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
  [polygon.id]: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
}