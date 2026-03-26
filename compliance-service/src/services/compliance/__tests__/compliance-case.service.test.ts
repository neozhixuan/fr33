import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  actionCaseByRevokingVc,
  revokeAnyVc,
} from "../compliance-case.service";

jest.mock("../../../model/compliance-case.repository", () => ({
  actionComplianceCase: jest.fn(),
  dismissComplianceCase: jest.fn(),
  listComplianceCases: jest.fn(),
  markIssuedVcRevoked: jest.fn(),
}));

jest.mock("../../../model/compliance.repository", () => ({
  getProfileByWallet: jest.fn(),
}));

jest.mock("../../../model/escrow-activity.repository", () => ({
  listEscrowActivities: jest.fn(),
}));

jest.mock("../../blockchain/blockchain.service", () => ({
  revokeVcRegistryTx: jest.fn(),
}));

import {
  actionComplianceCase,
  markIssuedVcRevoked,
} from "../../../model/compliance-case.repository";
import { revokeVcRegistryTx } from "../../blockchain/blockchain.service";

const mockedActionComplianceCase = actionComplianceCase as any;
const mockedMarkIssuedVcRevoked = markIssuedVcRevoked as any;
const mockedRevokeVcRegistryTx = revokeVcRegistryTx as any;

describe("compliance-case.service", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("actions case by revoking VC and recording tx hash", async () => {
    mockedRevokeVcRegistryTx.mockResolvedValue("0xabc");
    mockedActionComplianceCase.mockResolvedValue({
      id: 88,
      status: "ACTIONED",
    });

    const result = await actionCaseByRevokingVc({
      caseId: 88,
      vcHash: "hash-1",
      notes: "manual action",
    });

    expect(mockedRevokeVcRegistryTx).toHaveBeenCalledWith("hash-1");
    expect(mockedMarkIssuedVcRevoked).toHaveBeenCalledWith("hash-1");
    expect(mockedActionComplianceCase).toHaveBeenCalledWith(
      88,
      "0xabc",
      "manual action",
    );
    expect(result).toEqual({ id: 88, status: "ACTIONED" });
  });

  it("revokeAnyVc returns default note when note is omitted", async () => {
    mockedRevokeVcRegistryTx.mockResolvedValue("0xtx");

    const result = await revokeAnyVc({ vcHash: "hash-2" });

    expect(mockedRevokeVcRegistryTx).toHaveBeenCalledWith("hash-2");
    expect(mockedMarkIssuedVcRevoked).toHaveBeenCalledWith("hash-2");
    expect(result).toEqual({
      vcHash: "hash-2",
      txHash: "0xtx",
      notes: "VC revoked by admin",
    });
  });
});
