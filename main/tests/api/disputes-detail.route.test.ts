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
  getDisputeDetailsForUserAction: jest.fn(),
}));

import { GET } from "../../app/api/disputes/[disputeId]/route";
import { auth } from "@/server/auth";
import { getSessionUserId } from "@/utils/disputeUtils";
import { getDisputeDetailsForUserAction } from "@/lib/disputeActions";

const mockedAuth = auth as jest.MockedFunction<typeof auth>;
const mockedGetSessionUserId =
  getSessionUserId as jest.MockedFunction<typeof getSessionUserId>;
const mockedGetDisputeDetails =
  getDisputeDetailsForUserAction as jest.MockedFunction<
    typeof getDisputeDetailsForUserAction
  >;

describe("/api/disputes/[disputeId] route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid disputeId", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "1" } } as never);
    mockedGetSessionUserId.mockReturnValue(1);

    const req = {} as unknown as Parameters<typeof GET>[0];
    const res = await GET(req, { params: Promise.resolve({ disputeId: "abc" }) });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: "Invalid disputeId" });
    expect(mockedGetDisputeDetails).not.toHaveBeenCalled();
  });

  it("returns dispute details for valid request", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "5" } } as never);
    mockedGetSessionUserId.mockReturnValue(5);
    mockedGetDisputeDetails.mockResolvedValue({ id: 22, status: "OPEN" } as never);

    const req = {} as unknown as Parameters<typeof GET>[0];
    const res = await GET(req, { params: Promise.resolve({ disputeId: "22" }) });

    expect(mockedGetDisputeDetails).toHaveBeenCalledWith({
      disputeId: 22,
      userId: 5,
      allowAdmin: true,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, dispute: { id: 22, status: "OPEN" } });
  });
});
