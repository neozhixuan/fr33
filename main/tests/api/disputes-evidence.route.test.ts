import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const jsonMock = jest.fn((body: unknown, init?: { status?: number }) => ({
  body,
  status: init?.status ?? 200,
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jsonMock,
  },
}));

jest.mock("@/server/auth", () => ({ auth: jest.fn() }));
jest.mock("@/utils/disputeUtils", () => ({ getSessionUserId: jest.fn() }));
jest.mock("@/lib/disputeActions", () => ({
  submitDisputeEvidenceAction: jest.fn(),
}));

import { POST } from "../../app/api/disputes/[disputeId]/evidence/route";
import { auth } from "@/server/auth";
import { getSessionUserId } from "@/utils/disputeUtils";
import { submitDisputeEvidenceAction } from "@/lib/disputeActions";

const mockedAuth = auth as jest.MockedFunction<typeof auth>;
const mockedGetSessionUserId =
  getSessionUserId as jest.MockedFunction<typeof getSessionUserId>;
const mockedSubmitEvidence =
  submitDisputeEvidenceAction as jest.MockedFunction<
    typeof submitDisputeEvidenceAction
  >;

describe("/api/disputes/[disputeId]/evidence route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid evidenceType", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "4" } } as never);
    mockedGetSessionUserId.mockReturnValue(4);

    const req = {
      headers: { get: () => null },
      json: async () => ({
        evidenceType: "BAD_TYPE",
        contentText: "proof",
      }),
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req, { params: Promise.resolve({ disputeId: "6" }) });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: "Invalid evidenceType" });
    expect(mockedSubmitEvidence).not.toHaveBeenCalled();
  });

  it("submits evidence with idempotency header", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "4" } } as never);
    mockedGetSessionUserId.mockReturnValue(4);
    mockedSubmitEvidence.mockResolvedValue({ success: true } as never);

    const req = {
      headers: { get: (k: string) => (k === "x-idempotency-key" ? "idem-1" : null) },
      json: async () => ({
        evidenceType: "STATEMENT",
        contentText: "Delivered milestone A",
      }),
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req, { params: Promise.resolve({ disputeId: "6" }) });

    expect(mockedSubmitEvidence).toHaveBeenCalledWith({
      disputeId: 6,
      userId: 4,
      evidenceType: "STATEMENT",
      contentText: "Delivered milestone A",
      attachmentUrl: undefined,
      externalRef: undefined,
      idempotencyKey: "idem-1",
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});
