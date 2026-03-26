import { describe, expect, it, jest } from "@jest/globals";

import { evaluateRulesForWalletEvent } from "../rule-engine.service";

jest.mock("../../../config/compliance.config", () => ({
  getComplianceConfig: jest.fn(),
}));

jest.mock("../../../model/escrow-activity.repository", () => ({
  countWalletEventsSince: jest.fn(),
  getWalletCreatedEscrowActivities: jest.fn(),
}));

import { getComplianceConfig } from "../../../config/compliance.config";
import {
  countWalletEventsSince,
  getWalletCreatedEscrowActivities,
} from "../../../model/escrow-activity.repository";

const mockedGetComplianceConfig = getComplianceConfig as any;
const mockedCountWalletEventsSince = countWalletEventsSince as any;
const mockedGetWalletCreatedEscrowActivities =
  getWalletCreatedEscrowActivities as any;

describe("rule-engine.service", () => {
  it("triggers LARGE_ESCROW_ANOMALY for unusually large JOB_CREATED amount", async () => {
    mockedGetComplianceConfig.mockReturnValue({
      largeEscrow: {
        lookbackHours: 24,
        minBaselineTxCount: 2,
        multiplier: 2,
        absoluteMinWei: 100n,
        scoreDelta: 25,
      },
      disputeFrequency: {
        lookbackHours: 24,
        minJobs: 3,
        disputeRatioThreshold: 0.5,
        scoreDelta: 15,
      },
      burstActivity: {
        minEventCount: 10,
        windowMinutes: 15,
        scoreDelta: 5,
      },
    });

    mockedGetWalletCreatedEscrowActivities.mockResolvedValue([
      { amountWei: "100", sourceEventId: "old-1" },
      { amountWei: "200", sourceEventId: "old-2" },
    ]);
    mockedCountWalletEventsSince.mockResolvedValue(1);

    const rules = await evaluateRulesForWalletEvent("0xabc", {
      sourceEventId: "evt-1",
      txHash: "0xhash",
      blockTimestamp: new Date("2026-01-01T00:00:00.000Z"),
      eventType: "JOB_CREATED",
      amountWei: "1000",
    } as any);

    const largeEscrowRule = rules.find(
      (r) => r.ruleName === "LARGE_ESCROW_ANOMALY",
    );
    expect(largeEscrowRule).toBeDefined();
    expect(largeEscrowRule?.scoreDelta).toBe(25);
    expect(largeEscrowRule?.sourceEventId).toBe("evt-1");
  });

  it("triggers HIGH_DISPUTE_FREQUENCY for excessive cancellation ratio", async () => {
    mockedGetComplianceConfig.mockReturnValue({
      largeEscrow: {
        lookbackHours: 24,
        minBaselineTxCount: 2,
        multiplier: 2,
        absoluteMinWei: 100n,
        scoreDelta: 25,
      },
      disputeFrequency: {
        lookbackHours: 24,
        minJobs: 3,
        disputeRatioThreshold: 0.5,
        scoreDelta: 15,
      },
      burstActivity: {
        minEventCount: 100,
        windowMinutes: 15,
        scoreDelta: 5,
      },
    });

    mockedCountWalletEventsSince
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(2);

    const rules = await evaluateRulesForWalletEvent("0xabc", {
      sourceEventId: "evt-2",
      txHash: "0xhash2",
      blockTimestamp: new Date("2026-01-01T00:10:00.000Z"),
      eventType: "JOB_CANCELLED",
      amountWei: null,
    } as any);

    const disputeRule = rules.find(
      (r) => r.ruleName === "HIGH_DISPUTE_FREQUENCY",
    );
    expect(disputeRule).toBeDefined();
    expect(disputeRule?.scoreDelta).toBe(15);
    expect(disputeRule?.sourceEventId).toBe("evt-2");
  });
});
