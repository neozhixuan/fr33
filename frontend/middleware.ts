import { NextResponse } from "next/server";

export function middleware(req: Request) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/job-portal/:path*", "/job-portal"],
};
