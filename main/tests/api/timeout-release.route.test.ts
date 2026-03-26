import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

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

jest.mock("@/lib/disputeActions", () => ({
  triggerTimeoutAutoReleaseSweepAction: jest.fn(),
}));

jest.mock("@/model/disputeGet", () => ({
  getUserDisputeContext: jest.fn(),
}));

import { POST } from "../../app/api/system/timeout-release/route";
import { auth } from "@/server/auth";
import { triggerTimeoutAutoReleaseSweepAction } from "@/lib/disputeActions";
import { getUserDisputeContext } from "@/model/disputeGet";

const mockedAuth = auth as jest.MockedFunction<typeof auth>;
const mockedTriggerSweep =
  triggerTimeoutAutoReleaseSweepAction as jest.MockedFunction<
    typeof triggerTimeoutAutoReleaseSweepAction
  >;
const mockedGetUserDisputeContext =
  getUserDisputeContext as jest.MockedFunction<typeof getUserDisputeContext>;

describe("/api/system/timeout-release route", () => {
  const oldCronKey = process.env.NEXT_SYSTEM_CRON_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (oldCronKey === undefined) {
      delete process.env.NEXT_SYSTEM_CRON_KEY;
    } else {
      process.env.NEXT_SYSTEM_CRON_KEY = oldCronKey;
    }
  });

  it("allows cron key requests", async () => {
    process.env.NEXT_SYSTEM_CRON_KEY = "secret-key";
    mockedTriggerSweep.mockResolvedValue({
      success: true,
      checked: 3,
    } as never);

    const req = {
      headers: {
        get: (name: string) =>
          name === "x-system-cron-key" ? "secret-key" : null,
      },
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, checked: 3 });
    expect(mockedAuth).not.toHaveBeenCalled();
  });

  it("returns 401 for unauthorized request", async () => {
    delete process.env.NEXT_SYSTEM_CRON_KEY;
    mockedAuth.mockResolvedValue(null as never);

    const req = {
      headers: {
        get: () => null,
      },
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: "Unauthorized" });
    expect(mockedTriggerSweep).not.toHaveBeenCalled();
  });

  it("allows authenticated admin when cron key is not provided", async () => {
    delete process.env.NEXT_SYSTEM_CRON_KEY;
    mockedAuth.mockResolvedValue({ user: { id: "22" } } as never);
    mockedGetUserDisputeContext.mockResolvedValue({ role: "ADMIN" } as never);
    mockedTriggerSweep.mockResolvedValue({
      success: true,
      checked: 1,
    } as never);

    const req = {
      headers: {
        get: () => null,
      },
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req);

    expect(mockedGetUserDisputeContext).toHaveBeenCalledWith(22);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, checked: 1 });
  });

  it("returns 500 when sweep execution fails", async () => {
    process.env.NEXT_SYSTEM_CRON_KEY = "secret-key";
    mockedTriggerSweep.mockRejectedValue(new Error("sweep failed"));

    const req = {
      headers: {
        get: (name: string) =>
          name === "x-system-cron-key" ? "secret-key" : null,
      },
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: "sweep failed" });
  });
});
