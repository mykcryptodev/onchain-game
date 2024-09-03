import { xai } from "thirdweb/chains";
import { isAddressEqual, zeroAddress } from "viem";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

type Move = {
  direction: "up" | "down" | "left" | "right";
  x: number;
  y: number;
  currentScore: number;
}

type History = {
  moves: Move[];
}

export const snakeRouter = createTRPCRouter({
  create: protectedProcedure
    .mutation(async ({ ctx }) => {
      return await ctx.db.snakeGame.create({
        data: {
          player: ctx.session.user.address ?? zeroAddress,
          history: { moves: [] },
          score: 0,
        },
      });
    }),
  recordMove: protectedProcedure
    .input(z.object({
      id: z.string(),
      move: z.object({
        direction: z.enum(["up", "down", "left", "right"]),
        x: z.number(),
        y: z.number(),
        currentScore: z.number(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.snakeGame.findFirst({
        where: { id: input.id },
      });
      if (!game) {
        throw new Error("Game not found");
      }
      if (!isAddressEqual(ctx.session.user.address ?? zeroAddress, game.player)) {
        throw new Error("You are not the player of this game");
      }

      const currentHistory = game.history as History;

      const newHistory = {
        moves: [...currentHistory.moves, input.move]
      };

      return await ctx.db.snakeGame.update({
        where: { id: input.id },
        data: { history: newHistory },
      });
    }),
});
