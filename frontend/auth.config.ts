import type { NextAuthConfig } from "next-auth";

const ALLOWED_UNAUTHORISED_PATHS: Array<string> = ["/", "/register"];

export const authConfig = {
  pages: {
    /* Redirect to custom login page */
    signIn: "/login",
  },
  callbacks: {
    /* Return true/false if request is authorised in this page */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const isOnLandingPage = ALLOWED_UNAUTHORISED_PATHS.includes(
        nextUrl.pathname
      );
      if (!isOnLandingPage) {
        if (isLoggedIn) {
          return true;
        }
        return false;
      }

      return true;
    },
  },

  providers: [],
} satisfies NextAuthConfig;
