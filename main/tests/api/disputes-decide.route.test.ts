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

jest.mock("@/server/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/utils/disputeUtils", () => ({
  getSessionUserId: jest.fn(),
}));

jest.mock("@/lib/disputeActions", () => ({
  decideDisputeAction: jest.fn(),
}));

import { POST } from "../../app/api/disputes/[disputeId]/decide/route";
import { auth } from "@/server/auth";
import { getSessionUserId } from "@/utils/disputeUtils";
import { decideDisputeAction } from "@/lib/disputeActions";

const mockedAuth = auth as jest.MockedFunction<typeof auth>;
const mockedGetSessionUserId = getSessionUserId as jest.MockedFunction<
  typeof getSessionUserId
>;
const mockedDecideDisputeAction = decideDisputeAction as jest.MockedFunction<
  typeof decideDisputeAction
>;

describe("/api/disputes/[disputeId]/decide route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when SPLIT has invalid workerShareBps", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "1" } } as never);
    mockedGetSessionUserId.mockReturnValue(1);

    const req = {
      json: async () => ({
        outcome: "SPLIT",
        rationale: "split decision",
      }),
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req, {
      params: Promise.resolve({ disputeId: "4" }),
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: "workerShareBps must be between 0 and 10000 for SPLIT outcome",
    });
    expect(mockedDecideDisputeAction).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid outcome", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "2" } } as never);
    mockedGetSessionUserId.mockReturnValue(2);

    const req = {
      json: async () => ({
        outcome: "WRONG_OUTCOME",
        rationale: "x",
      }),
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req, {
      params: Promise.resolve({ disputeId: "3" }),
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: "Invalid outcome" });
    expect(mockedDecideDisputeAction).not.toHaveBeenCalled();
  });

  it("calls decide action for valid payload", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "11" } } as never);
    mockedGetSessionUserId.mockReturnValue(11);
    mockedDecideDisputeAction.mockResolvedValue({ success: true } as never);

    const req = {
      json: async () => ({
        outcome: "RETURN_TO_EMPLOYER",
        rationale: "refund employer",
      }),
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req, {
      params: Promise.resolve({ disputeId: "8" }),
    });

    expect(mockedDecideDisputeAction).toHaveBeenCalledWith({
      disputeId: 8,
      adminUserId: 11,
      outcome: "RETURN_TO_EMPLOYER",
      rationale: "refund employer",
      workerShareBps: undefined,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});
