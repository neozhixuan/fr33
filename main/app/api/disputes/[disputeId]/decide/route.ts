import { NextRequest, NextResponse } from "next/server";
import { decideDisputeAction } from "@/lib/disputeActions";
import { auth } from "@/server/auth";
import { DisputeOutcome } from "@/utils/dispute";

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

const OUTCOMES: DisputeOutcome[] = [
  "RELEASE_TO_WORKER",
  "RETURN_TO_EMPLOYER",
  "SPLIT",
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> },
) {
  try {
    const session = await auth();
    const adminUserId = getSessionUserId(session);
    const disputeId = Number((await params).disputeId);

    const body = await req.json();
    const outcome = String(body?.outcome || "") as DisputeOutcome;
    const rationale = String(body?.rationale || "").trim();
    const workerShareBps =
      body?.workerShareBps === undefined
        ? undefined
        : Number(body.workerShareBps);

    if (!Number.isInteger(disputeId) || disputeId <= 0) {
      throw new Error("Invalid disputeId");
    }

    if (!OUTCOMES.includes(outcome)) {
      throw new Error("Invalid outcome");
    }

    if (!rationale) {
      throw new Error("rationale is required");
    }

    const invalidSplitBps =
      workerShareBps === undefined ||
      Number.isNaN(workerShareBps) ||
      workerShareBps < 0 ||
      workerShareBps > 10000;

    if (outcome === "SPLIT" && invalidSplitBps) {
      throw new Error(
        "workerShareBps must be between 0 and 10000 for SPLIT outcome",
      );
    }

    const result = await decideDisputeAction({
      disputeId,
      adminUserId,
      outcome,
      rationale,
      workerShareBps,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: (error as Error).message.includes("Unauthorized") ? 401 : 400 },
    );
  }
}
