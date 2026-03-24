import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { triggerTimeoutAutoReleaseSweepAction } from "@/lib/disputeActions";
import { getUserDisputeContext } from "@/model/disputeGet";
import { UserRole } from "@/generated/prisma-client";

/**
 * Checks if the incoming request is authorized to trigger the timeout auto-release sweep.
 * Authorization can be granted either by providing a valid cron key in the headers or by being an authenticated admin user.
 * @param req - The incoming NextRequest object containing headers and session information.
 * @returns A boolean indicating whether the request is authorized to perform the action.
 */
async function isAuthorised(req: NextRequest): Promise<boolean> {
  const cronKey = process.env.NEXT_SYSTEM_CRON_KEY;
  if (cronKey) {
    const provided = req.headers.get("x-system-cron-key");
    if (provided === cronKey) {
      return true;
    }
  }

  const session = await auth();
  const rawId = session?.user?.id;
  const userId = Number(rawId);
  if (!rawId || !Number.isInteger(userId) || userId <= 0) {
    return false;
  }

  const user = await getUserDisputeContext(userId);
  return user?.role === UserRole.ADMIN;
}

// API: Endpoint to trigger the timeout auto-release sweep, which checks for any jobs
//      that have reached their timeout and automatically releases funds if necessary.
//      This is typically called by a scheduled cron job.
// USAGE: POST /api/system/timeout-release
export async function POST(req: NextRequest) {
  try {
    const ok = await isAuthorised(req);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const result = await triggerTimeoutAutoReleaseSweepAction();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
