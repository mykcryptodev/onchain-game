import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const secretRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure
    .input(z.object({
      address: z.string(),
    }))
    .query(({ ctx, input }) => {
      // you can confidently grab the user's verified address from context
      const userVerifiedAddress = ctx.session.user.address;
      // you can compare this address to the one provided by the user on the front end
      const frontEndProvidedAddress = input.address;
      // if they do not match, you can throw an error
      if (userVerifiedAddress !== frontEndProvidedAddress) {
        throw new Error("Address mismatch");
      }
      return "you can now see this secret message!";
    }),
});
