import { NextRequest, NextResponse } from "next/server";
import { submitDisputeEvidenceAction } from "@/lib/disputeActions";
import { auth } from "@/server/auth";
import { getSessionUserId } from "@/utils/disputeUtils";
import { DisputeEvidenceType } from "@/type/disputeTypes";

// Types of evidence supported for submission in a dispute
const ALLOWED_TYPES: DisputeEvidenceType[] = [
  "STATEMENT",
  "DELIVERY_PROOF",
  "COMMUNICATION_LOG",
  "SCREENSHOT",
  "INVOICE",
  "OTHER",
];

// API: Endpoint for users to submit evidence for a dispute, with validation and idempotency support
// USAGE: POST /api/disputes/[disputeId]/evidence with JSON body { evidenceType: string, contentText: string, attachmentUrl?: string, externalRef?: string, idempotencyKey?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> },
) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    const disputeId = Number((await params).disputeId);

    // Parse evidence type and evidence content
    const body = await req.json();
    const evidenceType = String(
      body?.evidenceType || "STATEMENT",
    ) as DisputeEvidenceType;
    const contentText = String(body?.contentText || "").trim();

    if (!Number.isInteger(disputeId) || disputeId <= 0) {
      throw new Error("Invalid disputeId");
    }
    if (!ALLOWED_TYPES.includes(evidenceType)) {
      throw new Error("Invalid evidenceType");
    }
    if (!contentText) {
      throw new Error("contentText is required");
    }

    // Support idempotency to prevent duplicate evidence submissions
    const idempotencyKey =
      req.headers.get("x-idempotency-key") ||
      (body?.idempotencyKey ? String(body.idempotencyKey) : undefined);

    const result = await submitDisputeEvidenceAction({
      disputeId,
      userId,
      evidenceType,
      contentText,
      attachmentUrl: body?.attachmentUrl
        ? String(body.attachmentUrl)
        : undefined,
      externalRef: body?.externalRef ? String(body.externalRef) : undefined,
      idempotencyKey,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: (error as Error).message.includes("Unauthorized") ? 401 : 400 },
    );
  }
}
