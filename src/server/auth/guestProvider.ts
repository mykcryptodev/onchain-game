import { type NextAuthOptions } from "next-auth";

import { db } from "~/server/db";

export const GuestProvider = (): NextAuthOptions["providers"][number] => ({
  id: "guest",
  name: "Guest",
  type: "credentials",
  credentials: {},
  async authorize() {
    const user = await db.user.create({
      data: {
        name: null,
        email: null,
        image: null,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  },
});