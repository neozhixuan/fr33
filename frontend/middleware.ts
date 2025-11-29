import { NextResponse } from "next/server";

import { auth } from "./lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;

  if (!isLoggedIn) {
    const loginUrl = req.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "unauthorised");
    loginUrl.searchParams.set("from", req.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  // Logged in
  return NextResponse.next();
});

// Next.js middleware configuration
export const config = {
  matcher: ["/job-portal/:path*"], // These paths run through the auth middleware
};
