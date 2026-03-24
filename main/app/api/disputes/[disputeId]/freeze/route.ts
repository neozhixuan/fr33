import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { adminFreezeDisputeEscrowAction } from "@/lib/disputeActions";
import { getSessionUserId } from "@/utils/disputeUtils";

// API: Admin endpoint to freeze the escrow for a dispute, preventing any further actions until reviewed.
// USAGE: POST /api/disputes/[disputeId]/freeze
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> },
) {
  try {
    const session = await auth();
    const adminUserId = getSessionUserId(session);
    const disputeId = Number((await params).disputeId);

    if (!Number.isInteger(disputeId) || disputeId <= 0) {
      throw new Error("Invalid disputeId");
    }

    const result = await adminFreezeDisputeEscrowAction({
      disputeId,
      adminUserId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: (error as Error).message.includes("Unauthorized") ? 401 : 400 },
    );
  }
}
