import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

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

      // Create a JSON object with the game state
      const gameState = {
        id: game.id,
        userId: game.userId,
        score: game.score,
        history: game.history
      }

      try {
        // Upload the game state to IPFS via Pinata
        const result = await pinata.pinJSONToIPFS(gameState)

        // Update the game record with the IPFS hash
        const updatedGame = await ctx.db.snakeGame.update({
          where: { id: input.id },
          data: {
            ipfsHash: result.IpfsHash,
          },
        })

        return {
          success: true,
          ipfsHash: result.IpfsHash,
          game: updatedGame,
        }
      } catch (error) {
        console.error("Error saving game to IPFS:", error)
        throw new Error("Failed to save game to IPFS")
      }
    }),

      // TODO: publish the results onchain
      // Implement ethers.js to interact with the contract
      // add the contract ABI to the server 
      // create the contract object with the contract address and the contract ABI
      // add the private key to the server environment variables 
      // create a function to call submitGameResult using the server private key
      // get the address of the current user from the connected wallet 
      // call the submitGameResult function with the user address game results, the IPFS CID, and the timestamp

      return true;
    }),
});
