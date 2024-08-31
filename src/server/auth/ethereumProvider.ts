import { type User } from "@prisma/client";
import { createConfig, getPublicClient,http } from "@wagmi/core";
import type { NextAuthOptions } from "next-auth";
import {type Address, isAddress, isAddressEqual,verifyMessage,zeroAddress } from 'viem'
import { base } from "wagmi/chains";

import { SUPPORTED_CHAINS } from "~/constants";
import { db } from "~/server/db";


type EthereumProviderConfig = {
  createUser: (credentials: { address: string }) => Promise<User>;
}
export const EthereumProvider = ({ createUser }: EthereumProviderConfig): NextAuthOptions["providers"][number] => ({
  id: "ethereum",
  name: "Ethereum",
  type: "credentials",
  credentials: {
    message: { label: "Message", type: "text" },
    signature: { label: "Signature", type: "text" },
    address: { label: "Address", type: "text" },
  },
  async authorize(credentials) {
    if (!credentials?.message || !credentials?.signature || !credentials?.address) {
      return null;
    }

    try {
      const isValid = await verifySignature(
        credentials.message,
        credentials.signature,
        credentials.address,
      );

      if (isValid) {
        let user = await db.user.findFirst({
          where: { address: credentials.address },
        });

        if (!user) {
          user = await createUser({ address: credentials.address });
        }

        return {
          id: user.id,
          address: credentials.address,
        }
      }

      console.error("Signature verification failed")
      return null
    } catch (error) {
      console.error("Error verifying message:", error)
      return null
    }
  },
});

async function verifySignature(
  message: string,
  signature: string,
  address: Address,
  chainId: number = base.id,
): Promise<boolean> {
  // First, try standard EOA signature verification
  try {
    return await verifyMessage({
      message,
      address,
      signature: signature as `0x${string}`,
    });
  } catch (error) {
    console.warn("Not an EOA signature, trying EIP-1271...", error);
  }

  // If EOA verification fails, try EIP-1271 verification
  if (isAddress(address) && !isAddressEqual(address, zeroAddress)) {
    try {
      const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
      if (!chain) {
        throw new Error(`Chain ID ${chainId} not supported`);
      }
      const config = createConfig({ 
        chains: [chain], 
        transports: { 
          [chain.id]: http(),
        }, 
      });
      const client = getPublicClient(config);
      const isValid = await client?.verifyMessage({
        address, 
        message, 
        signature: signature as `0x${string}`,
      });
      return isValid ?? false;
    } catch (error) {
      console.error("EIP-1271 verification failed:", error)
    }
  }

  return false
}