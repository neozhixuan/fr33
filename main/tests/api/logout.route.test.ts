import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const redirectMock = jest.fn((to: string) => ({ location: to, status: 307 }));

jest.mock("next/server", () => ({
  NextResponse: {
    redirect: redirectMock,
  },
}));

jest.mock("@/server/auth", () => ({
  signOut: jest.fn(),
}));

import { GET, POST } from "../../app/api/logout/route";
import { signOut } from "@/server/auth";

const mockedSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe("/api/logout route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET signs out and redirects to requested page", async () => {
    const req = {
      url: "http://localhost:3000/api/logout?redirectTo=/login",
    } as unknown as Parameters<typeof GET>[0];

    const res = await GET(req);

    expect(mockedSignOut).toHaveBeenCalledWith({ redirectTo: "/login" });
    expect(res).toEqual({ location: "/login", status: 307 });
  });

  it("POST falls back to home redirect", async () => {
    const req = {
      url: "http://localhost:3000/api/logout",
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req);

    expect(mockedSignOut).toHaveBeenCalledWith({ redirectTo: "/" });
    expect(res).toEqual({ location: "/", status: 307 });
  });
});
