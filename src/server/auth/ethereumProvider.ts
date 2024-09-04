import { type User } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";

import verifySignature from "~/helpers/verifySignature";
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