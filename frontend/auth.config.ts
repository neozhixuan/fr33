import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcrypt";
import { getUserByEmail } from "@/model/user";
import type { NextAuthConfig } from "next-auth";

export default {
  pages: {
    signIn: "/login",
    signOut: "/",
  },
  providers: [
    Credentials({
      authorize: async (credentials) => {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string(),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await getUserByEmail(email);
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt", // required for Edge-friendly tokens
  },
} satisfies NextAuthConfig;
