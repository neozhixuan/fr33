import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { processWalletRules } from "../rule-processor.service";
import { actionCaseByRevokingVc } from "../compliance-case.service";

jest.mock("../../../model/compliance.repository", () => ({
  getOrCreateProfile: jest.fn(),
  incrementProfileScore: jest.fn(),
  getProfileByWallet: jest.fn(),
}));

jest.mock("../../../model/rule-trigger.repository", () => ({
  createRuleTriggerIfMissing: jest.fn(),
  attachTriggersToCase: jest.fn(),
}));

jest.mock("../rule-engine.service", () => ({
  evaluateRulesForWalletEvent: jest.fn(),
}));

jest.mock("../../../config/compliance.config", () => ({
  getComplianceConfig: jest.fn(),
}));

jest.mock("../monitor.service", () => ({
  logVerbose: jest.fn(),
}));

jest.mock("../../../model/escrow-activity.repository", () => ({
  listEscrowActivities: jest.fn(),
}));

jest.mock("../../blockchain/blockchain.service", () => ({
  revokeVcRegistryTx: jest.fn(),
}));

jest.mock("../../../model/compliance-case.repository", () => ({
  createComplianceCase: jest.fn(),
  getOpenCase: jest.fn(),
  dismissComplianceCase: jest.fn(),
  actionComplianceCase: jest.fn(),
  listComplianceCases: jest.fn(),
  markIssuedVcRevoked: jest.fn(),
}));

import { evaluateRulesForWalletEvent } from "../rule-engine.service";
import {
  createRuleTriggerIfMissing,
  attachTriggersToCase,
} from "../../../model/rule-trigger.repository";
import {
  actionComplianceCase,
  createComplianceCase,
  getOpenCase,
  markIssuedVcRevoked,
} from "../../../model/compliance-case.repository";
import {
  getOrCreateProfile,
  incrementProfileScore,
} from "../../../model/compliance.repository";
import { getComplianceConfig } from "../../../config/compliance.config";
import { revokeVcRegistryTx } from "../../blockchain/blockchain.service";

const mockedEvaluateRules = evaluateRulesForWalletEvent as any;
const mockedCreateTrigger = createRuleTriggerIfMissing as any;
const mockedAttachTriggersToCase = attachTriggersToCase as any;
const mockedCreateComplianceCase = createComplianceCase as any;
const mockedGetOpenCase = getOpenCase as any;
const mockedActionComplianceCase = actionComplianceCase as any;
const mockedMarkIssuedVcRevoked = markIssuedVcRevoked as any;
const mockedGetOrCreateProfile = getOrCreateProfile as any;
const mockedIncrementProfileScore = incrementProfileScore as any;
const mockedGetComplianceConfig = getComplianceConfig as any;
const mockedRevokeVcRegistryTx = revokeVcRegistryTx as any;

describe("cross-layer workflow validation (compliance service)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetComplianceConfig.mockReturnValue({ caseThreshold: 50 });
  });

  it("suspicious activity -> compliance case -> admin review action", async () => {
    mockedGetOrCreateProfile.mockResolvedValue({ id: 9 });
    mockedEvaluateRules.mockResolvedValue([
      {
        ruleName: "HIGH_DISPUTE_FREQUENCY",
        scoreDelta: 30,
        fingerprint: "fp-9",
        sourceEventId: "evt-9",
        sourceTxHash: "0xevt",
      },
    ]);
    mockedCreateTrigger.mockResolvedValue({
      id: 909,
      ruleName: "HIGH_DISPUTE_FREQUENCY",
      scoreDelta: 30,
    });
    mockedIncrementProfileScore.mockResolvedValue({ cumulativeScore: 75 });
    mockedGetOpenCase.mockResolvedValue(null);

    await processWalletRules("0xwallet", {
      sourceEventId: "evt-9",
      txHash: "0xevt",
      blockTimestamp: new Date("2026-01-01T08:00:00.000Z"),
      eventType: "JOB_CANCELLED",
      amountWei: null,
    });

    expect(mockedCreateComplianceCase).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: 9,
        triggerIds: [909],
        scoreAtCreation: 75,
      }),
    );

    mockedRevokeVcRegistryTx.mockResolvedValue("0xtxhash");
    mockedActionComplianceCase.mockResolvedValue({
      id: 61,
      status: "ACTIONED",
    });

    const actionedCase = await actionCaseByRevokingVc({
      caseId: 61,
      vcHash: "hash-61",
      notes: "admin reviewed and revoked",
    });

    expect(mockedRevokeVcRegistryTx).toHaveBeenCalledWith("hash-61");
    expect(mockedMarkIssuedVcRevoked).toHaveBeenCalledWith("hash-61");
    expect(mockedActionComplianceCase).toHaveBeenCalledWith(
      61,
      "0xtxhash",
      "admin reviewed and revoked",
    );
    expect(actionedCase).toEqual({ id: 61, status: "ACTIONED" });
    expect(mockedAttachTriggersToCase).not.toHaveBeenCalled();
  });
});
