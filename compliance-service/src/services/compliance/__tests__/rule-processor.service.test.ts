import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { processWalletRules } from "../rule-processor.service";

jest.mock("../../../model/compliance.repository", () => ({
  getOrCreateProfile: jest.fn(),
  incrementProfileScore: jest.fn(),
}));

jest.mock("../../../services/compliance/rule-engine.service", () => ({
  evaluateRulesForWalletEvent: jest.fn(),
}));

jest.mock("../../../model/rule-trigger.repository", () => ({
  createRuleTriggerIfMissing: jest.fn(),
  attachTriggersToCase: jest.fn(),
}));

jest.mock("../../../model/compliance-case.repository", () => ({
  getOpenCase: jest.fn(),
  createComplianceCase: jest.fn(),
}));

jest.mock("../../../config/compliance.config", () => ({
  getComplianceConfig: jest.fn(),
}));

jest.mock("../monitor.service", () => ({
  logVerbose: jest.fn(),
}));

import {
  getOrCreateProfile,
  incrementProfileScore,
} from "../../../model/compliance.repository";
import { evaluateRulesForWalletEvent } from "../rule-engine.service";
import {
  createRuleTriggerIfMissing,
  attachTriggersToCase,
} from "../../../model/rule-trigger.repository";
import {
  createComplianceCase,
  getOpenCase,
} from "../../../model/compliance-case.repository";
import { getComplianceConfig } from "../../../config/compliance.config";

const mockedGetOrCreateProfile = getOrCreateProfile as any;
const mockedIncrementProfileScore = incrementProfileScore as any;
const mockedEvaluateRules = evaluateRulesForWalletEvent as any;
const mockedCreateTrigger = createRuleTriggerIfMissing as any;
const mockedAttachTriggersToCase = attachTriggersToCase as any;
const mockedCreateComplianceCase = createComplianceCase as any;
const mockedGetOpenCase = getOpenCase as any;
const mockedGetComplianceConfig = getComplianceConfig as any;

describe("rule-processor.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetComplianceConfig.mockReturnValue({ caseThreshold: 60 });
  });

  it("returns early when no rules are triggered", async () => {
    mockedGetOrCreateProfile.mockResolvedValue({ id: 1 });
    mockedEvaluateRules.mockResolvedValue([]);

    await processWalletRules("0xabc", {
      sourceEventId: "evt-1",
      txHash: "0xtx",
      blockTimestamp: new Date("2026-01-01T00:00:00.000Z"),
      eventType: "JOB_CREATED",
      amountWei: "100",
    });

    expect(mockedCreateTrigger).not.toHaveBeenCalled();
    expect(mockedIncrementProfileScore).not.toHaveBeenCalled();
  });

  it("creates a compliance case when score crosses threshold", async () => {
    mockedGetOrCreateProfile.mockResolvedValue({ id: 2 });
    mockedEvaluateRules.mockResolvedValue([
      {
        ruleName: "BURST_ACTIVITY",
        scoreDelta: 30,
        fingerprint: "fp-1",
        sourceEventId: "evt-2",
        sourceTxHash: "0xtx2",
      },
    ]);

    mockedCreateTrigger.mockResolvedValue({
      id: 101,
      ruleName: "BURST_ACTIVITY",
      scoreDelta: 30,
    });

    mockedIncrementProfileScore.mockResolvedValue({ cumulativeScore: 80 });
    mockedGetOpenCase.mockResolvedValue(null);

    await processWalletRules("0xdef", {
      sourceEventId: "evt-2",
      txHash: "0xtx2",
      blockTimestamp: new Date("2026-01-01T01:00:00.000Z"),
      eventType: "JOB_CANCELLED",
      amountWei: null,
    });

    expect(mockedCreateComplianceCase).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: 2,
        scoreAtCreation: 80,
        triggerIds: [101],
      }),
    );
    expect(mockedAttachTriggersToCase).not.toHaveBeenCalled();
  });

  it("attaches triggers to an existing open case", async () => {
    mockedGetOrCreateProfile.mockResolvedValue({ id: 3 });
    mockedEvaluateRules.mockResolvedValue([
      {
        ruleName: "HIGH_DISPUTE_FREQUENCY",
        scoreDelta: 15,
        fingerprint: "fp-2",
        sourceEventId: "evt-3",
        sourceTxHash: "0xtx3",
      },
    ]);
    mockedCreateTrigger.mockResolvedValue({
      id: 202,
      ruleName: "HIGH_DISPUTE_FREQUENCY",
      scoreDelta: 15,
    });
    mockedIncrementProfileScore.mockResolvedValue({ cumulativeScore: 40 });
    mockedGetOpenCase.mockResolvedValue({ id: 55 });

    await processWalletRules("0xaaa", {
      sourceEventId: "evt-3",
      txHash: "0xtx3",
      blockTimestamp: new Date("2026-01-01T02:00:00.000Z"),
      eventType: "JOB_CANCELLED",
      amountWei: null,
    });

    expect(mockedAttachTriggersToCase).toHaveBeenCalledWith(55, [202]);
    expect(mockedCreateComplianceCase).not.toHaveBeenCalled();
  });

  it("does not update profile when all candidates are duplicates", async () => {
    mockedGetOrCreateProfile.mockResolvedValue({ id: 4 });
    mockedEvaluateRules.mockResolvedValue([
      {
        ruleName: "BURST_ACTIVITY",
        scoreDelta: 5,
        fingerprint: "dup-1",
        sourceEventId: "evt-4",
        sourceTxHash: "0xtx4",
      },
    ]);
    mockedCreateTrigger.mockResolvedValue(null);

    await processWalletRules("0xbbb", {
      sourceEventId: "evt-4",
      txHash: "0xtx4",
      blockTimestamp: new Date("2026-01-01T03:00:00.000Z"),
      eventType: "JOB_CREATED",
      amountWei: "1",
    });

    expect(mockedIncrementProfileScore).not.toHaveBeenCalled();
    expect(mockedAttachTriggersToCase).not.toHaveBeenCalled();
    expect(mockedCreateComplianceCase).not.toHaveBeenCalled();
  });
});
