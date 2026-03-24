import { NextRequest, NextResponse } from "next/server";
import {
  createDisputeAction,
  listMyDisputesAction,
  listOpenDisputesAdminAction,
} from "@/lib/disputeActions";
import { auth } from "@/server/auth";
import { getSessionUserId } from "@/utils/disputeUtils";

// API: Endpoint to list disputes for the authenticated user, with optional admin scope to list all open disputes.
// USAGE: GET /api/disputes?scope=my (default) or scope=admin
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

// API: Endpoint for users to create a new dispute for a specific job, with validation and error handling
// USAGE: POST /api/disputes with JSON body { jobId: number, reason: string }
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
