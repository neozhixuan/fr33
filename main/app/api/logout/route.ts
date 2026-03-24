import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/server/auth";

// API: Endpoint to log out the user by clearing their session and redirecting them to a specified page (default is home).
// USAGE: GET or POST /api/logout?redirectTo=/some-page
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/";
  await signOut({ redirectTo });
  // In case signOut doesn't perform a redirect itself, ensure we redirect.
  return NextResponse.redirect(redirectTo);
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/";
  await signOut({ redirectTo });
  return NextResponse.redirect(redirectTo);
}
