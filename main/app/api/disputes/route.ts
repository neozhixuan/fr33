import { NextRequest, NextResponse } from "next/server";
import {
  createDisputeAction,
  listMyDisputesAction,
  listOpenDisputesAdminAction,
} from "@/lib/disputeActions";
import { auth } from "@/server/auth";

function getSessionUserId(
  session: { user?: { id?: string | null } } | null,
): number {
  const raw = session?.user?.id;
  const parsed = Number(raw);
  if (!raw || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Unauthorized");
  }
  return parsed;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);

    const scope = req.nextUrl.searchParams.get("scope") || "my";

    if (scope === "admin") {
      const disputes = await listOpenDisputesAdminAction(userId);
      return NextResponse.json({ success: true, disputes });
    }

    const disputes = await listMyDisputesAction(userId);
    return NextResponse.json({ success: true, disputes });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: (error as Error).message.includes("Unauthorized") ? 401 : 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    const body = await req.json();

    const jobId = Number(body?.jobId);
    if (!Number.isInteger(jobId) || jobId <= 0) {
      throw new Error("Invalid jobId");
    }

    const result = await createDisputeAction({
      jobId,
      userId,
      reason: body?.reason,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: (error as Error).message.includes("Unauthorized") ? 401 : 400 },
    );
  }
}
