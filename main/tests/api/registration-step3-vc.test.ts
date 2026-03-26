import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("@/model/wallet", () => ({
  getWalletByUserId: jest.fn(),
}));

jest.mock("@/model/vc", () => ({
  createVCMetadataForWallet: jest.fn(),
  getValidVCForWallet: jest.fn(),
}));

jest.mock("@/model/user", () => ({
  updateUserOnboardingStage: jest.fn(),
}));

jest.mock("@/lib/ether", () => ({
  getContract: jest.fn(),
  getProvider: jest.fn(),
}));

import {
  completeVcIssuanceAction,
  prepareVcRegistrationAction,
} from "../../lib/vcActions";
import { getWalletByUserId } from "@/model/wallet";
import { createVCMetadataForWallet } from "@/model/vc";
import { updateUserOnboardingStage } from "@/model/user";
import { getContract, getProvider } from "@/lib/ether";
import { OnboardingStage } from "@/generated/prisma-client";

const mockedGetWalletByUserId = getWalletByUserId as jest.MockedFunction<
  typeof getWalletByUserId
>;
const mockedCreateVCMetadataForWallet =
  createVCMetadataForWallet as jest.MockedFunction<
    typeof createVCMetadataForWallet
  >;
const mockedUpdateUserOnboardingStage =
  updateUserOnboardingStage as jest.MockedFunction<
    typeof updateUserOnboardingStage
  >;
const mockedGetContract = getContract as jest.MockedFunction<
  typeof getContract
>;
const mockedGetProvider = getProvider as jest.MockedFunction<
  typeof getProvider
>;

describe("registration step 3 VC issuance guards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prepare returns error when registration authorisation is missing", async () => {
    const result = await prepareVcRegistrationAction({
      userId: 1,
      vcResponse: {
        success: true,
        vcHash: "a".repeat(64),
      } as never,
    });

    expect(result.success).toBe(false);
    expect(result.errorMsg).toBe(
      "Missing VC registration authorisation payload",
    );
  });

  it("prepare returns error when subject address does not match wallet", async () => {
    mockedGetWalletByUserId.mockResolvedValue({
      address: "0x1111111111111111111111111111111111111111",
    } as never);

    const result = await prepareVcRegistrationAction({
      userId: 1,
      vcResponse: {
        success: true,
        vcHash: "a".repeat(64),
        registrationAuthorisation: {
          subjectAddress: "0x2222222222222222222222222222222222222222",
          expiresAt: "1700000000",
          nonce: "1",
          deadline: "1700000100",
          signature: "0xsig",
        },
      } as never,
    });

    expect(result.success).toBe(false);
    expect(result.errorMsg).toBe(
      "VC authorisation subject does not match wallet address",
    );
  });

  it("prepare builds registration tx request for valid payload", async () => {
    mockedGetWalletByUserId.mockResolvedValue({
      address: "0x1111111111111111111111111111111111111111",
    } as never);

    mockedGetProvider.mockReturnValue({} as never);
    const encodeFunctionData = jest.fn().mockReturnValue("0xdeadbeef");
    mockedGetContract.mockResolvedValue({
      interface: {
        encodeFunctionData,
      },
    } as never);

    const result = await prepareVcRegistrationAction({
      userId: 1,
      vcResponse: {
        success: true,
        vcHash: "a".repeat(64),
        registrationAuthorisation: {
          subjectAddress: "0x1111111111111111111111111111111111111111",
          expiresAt: "1700000000",
          nonce: "1",
          deadline: "1700000100",
          signature: "0xsig",
        },
      } as never,
    });

    expect(result.success).toBe(true);
    expect(result.txRequest?.data).toBe("0xdeadbeef");
    expect(encodeFunctionData).toHaveBeenCalled();
  });

  it("complete step fails when VC issuance is unsuccessful", async () => {
    mockedGetWalletByUserId.mockResolvedValue({
      id: 1,
      address: "0x1111111111111111111111111111111111111111",
    } as never);

    await expect(
      completeVcIssuanceAction({
        userId: 1,
        vcResponse: { success: false, errorMsg: "issuer down" } as never,
        txHash: `0x${"1".repeat(64)}`,
      }),
    ).rejects.toThrow("VC issuance failed: issuer down");
  });

  it("complete step stores VC metadata and marks onboarding completed", async () => {
    mockedGetWalletByUserId.mockResolvedValue({
      id: 1,
      address: "0x1111111111111111111111111111111111111111",
    } as never);
    mockedCreateVCMetadataForWallet.mockResolvedValue(undefined as never);
    mockedUpdateUserOnboardingStage.mockResolvedValue(undefined as never);

    await completeVcIssuanceAction({
      userId: 1,
      vcResponse: {
        success: true,
        vcHash: "a".repeat(64),
      } as never,
      txHash: `0x${"2".repeat(64)}`,
    });

    expect(mockedCreateVCMetadataForWallet).toHaveBeenCalled();
    expect(mockedUpdateUserOnboardingStage).toHaveBeenCalledWith(
      1,
      OnboardingStage.COMPLETED,
    );
  });
});
