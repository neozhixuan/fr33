import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("@/server/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/model/wallet", () => ({
  getWalletByUserId: jest.fn(),
}));

jest.mock("@/model/user", () => ({
  createUserWalletRecord: jest.fn(),
}));

import { createWallet, getWalletAddress } from "../../lib/aaActions";
import { auth } from "@/server/auth";
import { getWalletByUserId } from "@/model/wallet";
import { createUserWalletRecord } from "@/model/user";

const mockedAuth = auth as jest.MockedFunction<typeof auth>;
const mockedGetWalletByUserId = getWalletByUserId as jest.MockedFunction<
  typeof getWalletByUserId
>;
const mockedCreateUserWalletRecord =
  createUserWalletRecord as jest.MockedFunction<typeof createUserWalletRecord>;

describe("registration step 1 wallet guards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks wallet creation when session user does not match", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "2" } } as never);

    await expect(
      createWallet(1, "0x1111111111111111111111111111111111111111"),
    ).rejects.toThrow("Unauthorized wallet operation");
  });

  it("rejects invalid wallet address format", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "1" } } as never);

    const result = await createWallet(1, "invalid-address");

    expect(result).toEqual({
      success: false,
      errorMsg: "Invalid wallet address format",
    });
  });

  it("is idempotent when same wallet already linked", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "1" } } as never);
    mockedGetWalletByUserId.mockResolvedValue({
      address: "0x1111111111111111111111111111111111111111",
    } as never);

    const result = await createWallet(
      1,
      "0x1111111111111111111111111111111111111111",
    );

    expect(result).toEqual({ success: true });
    expect(mockedCreateUserWalletRecord).not.toHaveBeenCalled();
  });

  it("fails when a different wallet is already linked", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "1" } } as never);
    mockedGetWalletByUserId.mockResolvedValue({
      address: "0x2222222222222222222222222222222222222222",
    } as never);

    const result = await createWallet(
      1,
      "0x1111111111111111111111111111111111111111",
    );

    expect(result.success).toBe(false);
    expect(result.errorMsg).toContain("A different wallet is already linked");
  });

  it("creates wallet record when no existing wallet", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "1" } } as never);
    mockedGetWalletByUserId.mockResolvedValue(undefined as never);
    mockedCreateUserWalletRecord.mockResolvedValue(undefined as never);

    const result = await createWallet(
      1,
      "0x1111111111111111111111111111111111111111",
    );

    expect(mockedCreateUserWalletRecord).toHaveBeenCalledWith(
      1,
      "0x1111111111111111111111111111111111111111",
    );
    expect(result).toEqual({ success: true });
  });

  it("getWalletAddress enforces session guard", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "9" } } as never);

    await expect(getWalletAddress(1)).rejects.toThrow(
      "Unauthorized wallet operation",
    );
  });
});
