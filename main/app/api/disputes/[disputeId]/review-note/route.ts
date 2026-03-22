import { NextRequest, NextResponse } from "next/server";
import { addDisputeReviewNoteAction } from "@/lib/disputeActions";
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> },
) {
  try {
    const session = await auth();
    const adminUserId = getSessionUserId(session);
    const disputeId = Number((await params).disputeId);
    const body = await req.json();
    const note = String(body?.note || "").trim();

    if (!Number.isInteger(disputeId) || disputeId <= 0) {
      throw new Error("Invalid disputeId");
    }

    if (!note) {
      throw new Error("note is required");
    }

    const result = await addDisputeReviewNoteAction({
      disputeId,
      adminUserId,
      note,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: (error as Error).message.includes("Unauthorized") ? 401 : 400 },
    );
  }
}
