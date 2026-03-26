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

jest.mock("@/server/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/utils/disputeUtils", () => ({
  getSessionUserId: jest.fn(),
}));

jest.mock("@/lib/disputeActions", () => ({
  confirmCreateDisputeAction: jest.fn(),
  adminFreezeDisputeEscrowAction: jest.fn(),
  decideDisputeAction: jest.fn(),
  listMyDisputesAction: jest.fn(),
  listOpenDisputesAdminAction: jest.fn(),
  prepareCreateDisputeAction: jest.fn(),
}));

import {
  completeVcIssuanceAction,
  checkIsUserActionAllowed,
} from "../../lib/vcActions";
import { POST as createDisputePOST } from "../../app/api/disputes/route";
import { POST as freezeDisputePOST } from "../../app/api/disputes/[disputeId]/freeze/route";
import { POST as decideDisputePOST } from "../../app/api/disputes/[disputeId]/decide/route";

import { getWalletByUserId } from "@/model/wallet";
import { createVCMetadataForWallet, getValidVCForWallet } from "@/model/vc";
import { updateUserOnboardingStage } from "@/model/user";
import { getContract } from "@/lib/ether";
import { auth } from "@/server/auth";
import { getSessionUserId } from "@/utils/disputeUtils";
import {
  adminFreezeDisputeEscrowAction,
  confirmCreateDisputeAction,
  decideDisputeAction,
} from "@/lib/disputeActions";

const mockedGetWalletByUserId = getWalletByUserId as jest.MockedFunction<
  typeof getWalletByUserId
>;
const mockedCreateVCMetadataForWallet =
  createVCMetadataForWallet as jest.MockedFunction<
    typeof createVCMetadataForWallet
  >;
const mockedGetValidVCForWallet = getValidVCForWallet as jest.MockedFunction<
  typeof getValidVCForWallet
>;
const mockedUpdateUserOnboardingStage =
  updateUserOnboardingStage as jest.MockedFunction<
    typeof updateUserOnboardingStage
  >;
const mockedGetContract = getContract as jest.MockedFunction<
  typeof getContract
>;
const mockedAuth = auth as jest.MockedFunction<typeof auth>;
const mockedGetSessionUserId = getSessionUserId as jest.MockedFunction<
  typeof getSessionUserId
>;
const mockedConfirmCreateDisputeAction =
  confirmCreateDisputeAction as jest.MockedFunction<
    typeof confirmCreateDisputeAction
  >;
const mockedAdminFreezeDisputeEscrowAction =
  adminFreezeDisputeEscrowAction as jest.MockedFunction<
    typeof adminFreezeDisputeEscrowAction
  >;
const mockedDecideDisputeAction = decideDisputeAction as jest.MockedFunction<
  typeof decideDisputeAction
>;

describe("cross-layer workflow validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("onboarding -> VC issuance -> escrow participation allowed", async () => {
    mockedGetWalletByUserId.mockResolvedValue({
      id: 101,
      address: "0xabc",
    } as never);
    mockedCreateVCMetadataForWallet.mockResolvedValue(undefined as never);
    mockedUpdateUserOnboardingStage.mockResolvedValue(undefined as never);

    await completeVcIssuanceAction({
      userId: 101,
      vcResponse: { success: true, vcHash: "a".repeat(64) } as never,
      txHash: `0x${"1".repeat(64)}`,
    });

    mockedGetValidVCForWallet.mockResolvedValue({
      vcHash: "a".repeat(64),
    } as never);
    mockedGetContract.mockResolvedValue({
      isValid: jest.fn().mockResolvedValue(true as never),
    } as never);

    const allowed = await checkIsUserActionAllowed({
      id: 101,
      address: "0xabc",
    } as never);

    expect(allowed).toBe(true);
    expect(mockedCreateVCMetadataForWallet).toHaveBeenCalled();
    expect(mockedUpdateUserOnboardingStage).toHaveBeenCalled();
  });

  it("revoked or missing VC blocks escrow-critical action", async () => {
    mockedGetValidVCForWallet.mockResolvedValue(null);

    const allowed = await checkIsUserActionAllowed({
      id: 202,
      address: "0xdef",
    } as never);

    expect(allowed).toBe(false);
    expect(mockedGetContract).not.toHaveBeenCalled();
  });

  it("raise dispute -> freeze -> admin decide", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "9" } } as never);
    mockedGetSessionUserId.mockReturnValue(9);

    mockedConfirmCreateDisputeAction.mockResolvedValue({
      success: true,
      txHash: `0x${"4".repeat(64)}`,
      userOpHash: `0x${"5".repeat(64)}`,
      dispute: null,
    } as never);
    mockedAdminFreezeDisputeEscrowAction.mockResolvedValue({
      success: true,
      txHash: `0x${"6".repeat(64)}`,
      userOpHash: `0x${"7".repeat(64)}`,
    } as never);
    mockedDecideDisputeAction.mockResolvedValue({
      success: true,
      txHash: `0x${"8".repeat(64)}`,
      userOpHash: `0x${"9".repeat(64)}`,
    } as never);

    const createReq = {
      json: async () => ({
        mode: "confirm",
        jobId: 7,
        reason: "milestone dispute",
        txHash: `0x${"2".repeat(64)}`,
        userOpHash: `0x${"3".repeat(64)}`,
      }),
    } as unknown as Parameters<typeof createDisputePOST>[0];

    const createRes = await createDisputePOST(createReq);
    expect(createRes.status).toBe(200);

    const freezeReq = {} as unknown as Parameters<typeof freezeDisputePOST>[0];
    const freezeRes = await freezeDisputePOST(freezeReq, {
      params: Promise.resolve({ disputeId: "44" }),
    });
    expect(freezeRes.status).toBe(200);

    const decideReq = {
      json: async () => ({
        outcome: "RETURN_TO_EMPLOYER",
        rationale: "evidence supports employer",
      }),
    } as unknown as Parameters<typeof decideDisputePOST>[0];

    const decideRes = await decideDisputePOST(decideReq, {
      params: Promise.resolve({ disputeId: "44" }),
    });

    expect(decideRes.status).toBe(200);
    expect(mockedConfirmCreateDisputeAction).toHaveBeenCalled();
    expect(mockedAdminFreezeDisputeEscrowAction).toHaveBeenCalledWith({
      disputeId: 44,
      adminUserId: 9,
    });
    expect(mockedDecideDisputeAction).toHaveBeenCalledWith({
      disputeId: 44,
      adminUserId: 9,
      outcome: "RETURN_TO_EMPLOYER",
      rationale: "evidence supports employer",
      workerShareBps: undefined,
    });
  });
});
