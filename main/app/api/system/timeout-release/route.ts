import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { triggerTimeoutAutoReleaseSweepAction } from "@/lib/disputeActions";
import { getUserDisputeContext } from "@/model/dispute";
import { UserRole } from "@/generated/prisma-client";

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
