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
  adminFreezeDisputeEscrowAction: jest.fn(),
}));

import { POST } from "../../app/api/disputes/[disputeId]/freeze/route";
import { auth } from "@/server/auth";
import { getSessionUserId } from "@/utils/disputeUtils";
import { adminFreezeDisputeEscrowAction } from "@/lib/disputeActions";

const mockedAuth = auth as jest.MockedFunction<typeof auth>;
const mockedGetSessionUserId =
  getSessionUserId as jest.MockedFunction<typeof getSessionUserId>;
const mockedFreezeAction =
  adminFreezeDisputeEscrowAction as jest.MockedFunction<
    typeof adminFreezeDisputeEscrowAction
  >;

describe("/api/disputes/[disputeId]/freeze route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid disputeId", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "2" } } as never);
    mockedGetSessionUserId.mockReturnValue(2);

    const req = {} as unknown as Parameters<typeof POST>[0];
    const res = await POST(req, { params: Promise.resolve({ disputeId: "0" }) });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: "Invalid disputeId" });
  });

  it("freezes escrow for valid dispute", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "12" } } as never);
    mockedGetSessionUserId.mockReturnValue(12);
    mockedFreezeAction.mockResolvedValue({ success: true } as never);

    const req = {} as unknown as Parameters<typeof POST>[0];
    const res = await POST(req, { params: Promise.resolve({ disputeId: "19" }) });

    expect(mockedFreezeAction).toHaveBeenCalledWith({
      disputeId: 19,
      adminUserId: 12,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});
