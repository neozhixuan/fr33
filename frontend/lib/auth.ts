import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { z } from "zod";
import type { User } from "@/lib/definitions";
import bcrypt from "bcrypt";

import { getUserByEmail } from "@/model/user";

export const authConfig = {
  pages: {
    /* Redirect to custom login page */
    signIn: "/login",
  },
  callbacks: {
    /* Configure the authorised URLs in middleware.ts */
    authorized({ auth }) {
      const isLoggedIn = !!auth?.user;

      if (isLoggedIn) {
        return true;
      }
      return false;
    },
  },

  providers: [],
} satisfies NextAuthConfig;

export const { auth, signIn, signOut } = NextAuth({
  // Handle auth in auth.config.ts
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const user = getUserFromCredentials(credentials);
        if (!user) {
          console.error("[authorize] no user found with those credentials");
        }

        return user;
      },
    }),
  ],
});

async function getUserFromCredentials(
  credentials: Partial<Record<string, unknown>>
): Promise<User | null> {
  const parsedCredentials = z
    .object({
      email: z.string().email(),
      password: z.string().min(6),
    })
    .safeParse(credentials);

  if (parsedCredentials.success) {
    const { email, password } = parsedCredentials.data;

    const user = await getUserByEmail(email);
    if (!user) {
      console.error("[getUserFromCredentials] no user found with that email");
      return null;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.error("[getUserFromCredentials] password did not match");
      return null;
    }

    console.log("[getUserFromCredentials] Credentials did not match account");
  }

  return null;
}
