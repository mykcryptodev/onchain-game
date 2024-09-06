import { base, baseSepolia, type Chain } from "wagmi/chains";

export const APP_NAME = "Onchain Snake";
export const APP_DESCRIPTION = "Play the nostalgic onchain snake game and share your high scores!";
export const APP_URL = "https://onchainsnake.xyz";
export const SUPPORTED_CHAINS: readonly [Chain, ...Chain[]] = [base, baseSepolia];
export const DEFAULT_CHAIN = SUPPORTED_CHAINS[0];
export const EAS_SCHEMA_ID = "0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9";