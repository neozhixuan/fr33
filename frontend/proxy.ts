import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Protected routes will not even start rendering until the Proxy verifies the authentication
const auth = NextAuth(authConfig).auth;
export { auth as proxy };

export const config = {
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
