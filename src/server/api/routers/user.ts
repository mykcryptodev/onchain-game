import { z } from "zod";

import verifySignature from "~/helpers/verifySignature";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  linkEthereumAddress: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        signature: z.string(),
        address: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { message, signature, address } = input;
      const isValid = await verifySignature(
        message,
        signature as `0x${string}`,
        address,
      );
      console.log({ isValid });

      if (!isValid) {
        throw new Error("Invalid signature");
      }

      const user = await ctx.db.user.updateMany({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          address,
        },
      });

      return user;
    }),
});

export default userRouter;