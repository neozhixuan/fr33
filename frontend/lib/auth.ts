import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { z } from "zod";
import type { User } from "@/lib/definitions";

// import bcrypt from "bcrypt";
// import postgres from "postgres";

// const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const mockUser: User = {
  id: "1",
  name: "Mock User",
  email: "user@example.com",
  password: "password123",
};

// async function getUser(email: string): Promise<User | undefined> {
//   try {
//     const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
//     return user[0];
//   } catch (error) {
//     console.error("Failed to fetch user:", error);
//     throw new Error("Failed to fetch user.");
//   }
// }

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

const getUserFromCredentials = (
  credentials: Partial<Record<string, unknown>>
): User | null => {
  const parsedCredentials = z
    .object({
      email: z.string().email(),
      password: z.string().min(6),
    })
    .safeParse(credentials);

  if (parsedCredentials.success) {
    const { email, password } = parsedCredentials.data;

    if (email === mockUser.email && password === mockUser.password) {
      return mockUser;
    }
    console.log("[getUserFromCredentials] Credentials did not match account");
  }

  return null;
};
