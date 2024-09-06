import pinataSDK from "@pinata/sdk";
import { z } from "zod";

import { env } from "~/env.js"
import { getLeaderboard } from "~/thirdweb/84532/0x5decd7c00316f7b9b72c8c2d8b4e2d7e5a886259";
const pinata = new pinataSDK(env.PINATA_API_KEY, env.PINATA_API_SECRET)

import { getContract } from "thirdweb";
import { base } from "thirdweb/chains";

import { thirdwebClient } from "~/config/thirdweb";
import { SNAKE_LEADERBOARD } from "~/constants/addresses";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const ENGINE_URL = `https://engine-production-3357.up.railway.app`;

type Action = {
  label: "up" | "down" | "left" | "right" | "eat" | "died";
  x: number;
  y: number;
  currentScore: number;
  length: number;
}

type History = {
  actions: Action[];
}

export const snakeRouter = createTRPCRouter({
  create: protectedProcedure
    .mutation(async ({ ctx }) => {
      return await ctx.db.snakeGame.create({
        data: {
          user: { connect: { id: ctx.session.user.id } },
          history: { actions: [] },
          score: 0,
        },
      });
    }),
  getLeaderboard: publicProcedure
    .query(async () => {
      const onchainData = await getLeaderboard({
        contract: getContract({
          client: thirdwebClient,
          address: SNAKE_LEADERBOARD,
          chain: base,
        }),
      });
      // turn all of the bigints into strings
      onchainData.map((entry) => {
        return {
          ...entry,
          score: entry.score.toString(),
          timestamp: entry.timestamp.toString(),
        }
      });
      return [...onchainData];
    }),
  recordMove: protectedProcedure
    .input(z.object({
      id: z.string(),
      action: z.object({
        label: z.enum(["up", "down", "left", "right", "eat", "died"]),
        x: z.number(),
        y: z.number(),
        currentScore: z.number(),
        length: z.number(),
      }),
      gridSize: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.snakeGame.findFirst({
        where: { id: input.id },
      });
      if (!game) {
        throw new Error("Game not found");
      }
      if (game.userId !== ctx.session.user.id) {
        throw new Error("You are not the player of this game");
      }

      const currentHistory = game.history as History;

      // if we find any action with a label of "died" in the game history, throw an error
      if (currentHistory.actions.some((action) => action.label === "died")) {
        throw new Error("Game is over");
      }

      // if a previous x or y is negative or greater than or equal to GRID_SIZE, throw an error
      if (currentHistory.actions.some((action) => action.x < 0 || action.x >= input.gridSize || action.y < 0 || action.y >= input.gridSize)) {
        throw new Error("Game is over");
      }

      const newHistory = {
        actions: [...currentHistory.actions, input.action]
      };

      return await ctx.db.snakeGame.update({
        where: { id: input.id },
        data: {
          history: newHistory,
          score: input.action.currentScore,
        },
      });
    }),
  saveGame: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.snakeGame.findFirst({
        where: { id: input.id },
      });
      if (!game) {
        throw new Error("Game not found");
      }
      if (game.userId !== ctx.session.user.id) {
        throw new Error("You are not the player of this game");
      }

      const gameState = {
        id: game.id,
        userId: game.userId,
        score: game.score,
        history: game.history
      }

      let ipfsUri: string

      try {
        const result = await pinata.pinJSONToIPFS(gameState)
        ipfsUri = `ipfs://${result.IpfsHash}`
      } catch (error) {
        console.error("Error saving game to IPFS:", error)
        throw new Error("Failed to save game to IPFS")
      }

      // Submit the game result to the blockchain
      try {
        const userAddress = ctx.session.user.address
        if (!userAddress) {
          throw new Error("User address not found")
        }

        const timestamp = Math.floor(Date.now() / 1000) // Current timestamp in seconds

        void fetch(
          `${ENGINE_URL}/contract/${base.id}/${SNAKE_LEADERBOARD}/write`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.ENGINE_ACCESS_TOKEN}`,
              "x-backend-wallet-address": `${env.ENGINE_WALLET_ADDRESS}`,
            },
            body: JSON.stringify({
              functionName: "submitGameResult",
              args: [
                userAddress,
                game.score,
                ipfsUri.replace('ipfs://', ''),
                timestamp,
              ],
            }),
          },
        );
        return {
          success: true,
          ipfsUri,
        }
      } catch (error) {
        console.error("Error submitting game result to blockchain:", error)
        throw new Error("Failed to submit game result to blockchain")
      }
    }),
  analytics: publicProcedure
    .query(async ({ ctx }) => {
      // get the number of total snake games
      const totalGames = await ctx.db.snakeGame.count();
      // get the number of unique users who have created snake games
      const uniqueUsersWhoCreatedGames = await ctx.db.user.count({
        where: {
          snakeGames: {
            some: {}
          }
        }
      });

      // get the number of players with an address
      const playersWithAddress = await ctx.db.snakeGame.count({
        where: {
          user: {
            address: {
              not: null,
            },
          },
        },
      });

      return {
        totalGames,
        uniqueUsersWhoCreatedGames,
        playersWithAddress,
      };
    }),
});
