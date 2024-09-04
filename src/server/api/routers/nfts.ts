import { z } from "zod";

import { BASE_COLORS } from "~/constants/addresses";
import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { type NftsByWalletResponse } from "~/types/simplehash";

export const nftRouter = createTRPCRouter({
  getOwnedBaseColors: publicProcedure
    .input(
      z.object({
        address: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { address } = input;
      const url = new URL(`https://api.simplehash.com/api/v0/nfts/owners`);
      url.searchParams.append("wallet_addresses", address);
      url.searchParams.append("contract_addresses", BASE_COLORS);
      url.searchParams.append("chains", "base"); // always get real base colors
      url.searchParams.append("limit", "50");

      const data: NftsByWalletResponse = {
        nfts: [],
        next: null,
        next_cursor: null,
        previous: null,
      };
      let nextUrl: string | null = url.toString();

      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: "GET",
          headers: {
            accept: "application/json",
            "X-API-KEY": env.SIMPLEHASH_API_KEY,
          },
        });
        const responseData = (await response.json()) as NftsByWalletResponse;
        data.nfts.push(...responseData.nfts);
        nextUrl = responseData.next ?? null;
      }

      return data;
    }),
});
