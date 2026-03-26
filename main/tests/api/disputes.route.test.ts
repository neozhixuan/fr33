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
  listMyDisputesAction: jest.fn(),
  listOpenDisputesAdminAction: jest.fn(),
  prepareCreateDisputeAction: jest.fn(),
  confirmCreateDisputeAction: jest.fn(),
}));

import { GET, POST } from "../../app/api/disputes/route";
import { auth } from "@/server/auth";
import { getSessionUserId } from "@/utils/disputeUtils";
import {
  confirmCreateDisputeAction,
  listOpenDisputesAdminAction,
  listMyDisputesAction,
  prepareCreateDisputeAction,
} from "@/lib/disputeActions";

const mockedAuth = auth as jest.MockedFunction<typeof auth>;
const mockedGetSessionUserId = getSessionUserId as jest.MockedFunction<
  typeof getSessionUserId
>;
const mockedListMyDisputesAction = listMyDisputesAction as jest.MockedFunction<
  typeof listMyDisputesAction
>;
const mockedConfirmCreateDisputeAction =
  confirmCreateDisputeAction as jest.MockedFunction<
    typeof confirmCreateDisputeAction
  >;
const mockedListOpenDisputesAdminAction =
  listOpenDisputesAdminAction as jest.MockedFunction<
    typeof listOpenDisputesAdminAction
  >;
const mockedPrepareCreateDisputeAction =
  prepareCreateDisputeAction as jest.MockedFunction<
    typeof prepareCreateDisputeAction
  >;

describe("/api/disputes route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET returns current user's disputes", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "7" } } as never);
    mockedGetSessionUserId.mockReturnValue(7);
    mockedListMyDisputesAction.mockResolvedValue([{ id: 1 }] as never);

    const req = {
      nextUrl: new URL("http://localhost:3000/api/disputes"),
    } as unknown as Parameters<typeof GET>[0];

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, disputes: [{ id: 1 }] });
    expect(mockedListMyDisputesAction).toHaveBeenCalledWith(7);
  });

  it("GET with admin scope returns open disputes", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "77" } } as never);
    mockedGetSessionUserId.mockReturnValue(77);
    mockedListOpenDisputesAdminAction.mockResolvedValue([{ id: 33 }] as never);

    const req = {
      nextUrl: new URL("http://localhost:3000/api/disputes?scope=admin"),
    } as unknown as Parameters<typeof GET>[0];

    const res = await GET(req);

    expect(mockedListOpenDisputesAdminAction).toHaveBeenCalledWith(77);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, disputes: [{ id: 33 }] });
  });

  it("POST prepare validates and calls prepare action", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "8" } } as never);
    mockedGetSessionUserId.mockReturnValue(8);
    mockedPrepareCreateDisputeAction.mockResolvedValue({
      success: true,
    } as never);

    const req = {
      json: async () => ({
        mode: "prepare",
        jobId: 4,
      }),
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req);

    expect(mockedPrepareCreateDisputeAction).toHaveBeenCalledWith({
      jobId: 4,
      userId: 8,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("POST confirm returns 400 for invalid txHash", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "9" } } as never);
    mockedGetSessionUserId.mockReturnValue(9);

    const req = {
      json: async () => ({
        mode: "confirm",
        jobId: 3,
        txHash: "bad",
        userOpHash: `0x${"a".repeat(64)}`,
      }),
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: "Invalid txHash" });
    expect(mockedConfirmCreateDisputeAction).not.toHaveBeenCalled();
  });

  it("POST confirm returns 400 for invalid userOpHash", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "9" } } as never);
    mockedGetSessionUserId.mockReturnValue(9);

    const req = {
      json: async () => ({
        mode: "confirm",
        jobId: 3,
        txHash: `0x${"a".repeat(64)}`,
        userOpHash: "bad",
      }),
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: "Invalid userOpHash" });
    expect(mockedConfirmCreateDisputeAction).not.toHaveBeenCalled();
  });

  it("POST confirm calls confirm action for valid payload", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "10" } } as never);
    mockedGetSessionUserId.mockReturnValue(10);
    mockedConfirmCreateDisputeAction.mockResolvedValue({
      success: true,
    } as never);

    const req = {
      json: async () => ({
        mode: "confirm",
        jobId: 5,
        reason: "work rejected",
        txHash: `0x${"b".repeat(64)}`,
        userOpHash: `0x${"c".repeat(64)}`,
      }),
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req);

    expect(mockedConfirmCreateDisputeAction).toHaveBeenCalledWith({
      jobId: 5,
      userId: 10,
      reason: "work rejected",
      txHash: `0x${"b".repeat(64)}`,
      userOpHash: `0x${"c".repeat(64)}`,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});
