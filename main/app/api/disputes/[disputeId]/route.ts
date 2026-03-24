import { NextRequest, NextResponse } from "next/server";
import { getDisputeDetailsForUserAction } from "@/lib/disputeActions";
import { auth } from "@/server/auth";
import { getSessionUserId } from "@/utils/disputeUtils";

// API: Fetch dispute details for a specific dispute, ensuring the user is authorized to view it
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> },
) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    const disputeId = Number((await params).disputeId);

    if (!Number.isInteger(disputeId) || disputeId <= 0) {
      throw new Error("Invalid disputeId");
    }

    const dispute = await getDisputeDetailsForUserAction({
      disputeId,
      userId,
      allowAdmin: true,
    });

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: (error as Error).message.includes("Unauthorized") ? 401 : 400 },
    );
  }
}
