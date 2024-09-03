import { isAddressEqual, zeroAddress } from "viem";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

type Action = {
  label: "up" | "down" | "left" | "right" | "eat";
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
          player: ctx.session.user.address ?? zeroAddress,
          history: { actions: [] },
          score: 0,
        },
      });
    }),
  recordMove: protectedProcedure
    .input(z.object({
      id: z.string(),
      action: z.object({
        label: z.enum(["up", "down", "left", "right", "eat"]),
        x: z.number(),
        y: z.number(),
        currentScore: z.number(),
        length: z.number(),
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
        actions: [...currentHistory.actions, input.action]
      };

      return await ctx.db.snakeGame.update({
        where: { id: input.id },
        data: { history: newHistory },
      });
    }),
});
