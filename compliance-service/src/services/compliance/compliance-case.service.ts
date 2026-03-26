import { getProfileByWallet } from "../../model/compliance.repository";
import {
  dismissComplianceCase,
  actionComplianceCase,
  listComplianceCases,
  markIssuedVcRevoked,
} from "../../model/compliance-case.repository";
import { listEscrowActivities } from "../../model/escrow-activity.repository";

import { revokeVcRegistryTx } from "../blockchain/blockchain.service";
import { EscrowEventTypes } from "../../type/compliance.types";

// Service functions for managing compliance cases, including listing cases, dismissing cases, taking action on cases by revoking VCs, and fetching wallet profiles.
export async function listCases(params: {
  status?: "OPEN" | "DISMISSED" | "ACTIONED";
  wallet?: string;
}) {
  return listComplianceCases(params);
}

// Service function to dismiss a compliance case by its ID, with optional notes.
export async function dismissCase(caseId: number, notes: string) {
  return dismissComplianceCase(caseId, notes || "Dismissed by admin");
}

// Service function to take action on a compliance case by revoking the associated VC, which also marks the case as actioned with the provided notes.
export async function actionCaseByRevokingVc(params: {
  caseId: number;
  vcHash: string;
  notes: string;
}) {
  const txHash = await revokeVcRegistryTx(params.vcHash);

  await markIssuedVcRevoked(params.vcHash);

  return actionComplianceCase(
    params.caseId,
    txHash,
    params.notes || "VC revoked by admin",
  );
}

// Service function to revoke a VC by its hash
export async function revokeAnyVc(params: { vcHash: string; notes?: string }) {
  const txHash = await revokeVcRegistryTx(params.vcHash);
  await markIssuedVcRevoked(params.vcHash);

  return {
    vcHash: params.vcHash,
    txHash,
    notes: params.notes || "VC revoked by admin",
  };
}

async function listMonitoringEvents(params: {
  wallet?: string;
  eventType?: EscrowEventTypes;
  limit?: number;
  offset?: number;
}) {
  const events = await listEscrowActivities({
    wallet: params.wallet,
    eventType: params.eventType,
    limit: params.limit,
    offset: params.offset,
  });

  return events.map((event) => ({
    ...event,
    jobId: event.jobId.toString(),
    blockNumber: event.blockNumber.toString(),
    blockTimestamp: event.blockTimestamp.toISOString(),
    createdAt: event.createdAt.toISOString(),
  }));
}

// Service function to list the monitoring logs for a given wallet and event type, with pagination support.
export async function listMonitoringLogs(params: {
  wallet?: string;
  eventType?: EscrowEventTypes;
  limit?: number;
  offset?: number;
}) {
  return listMonitoringEvents(params);
}

// Service function to fetch a compliance profile associated with a wallet address.
export async function getWalletProfile(walletAddress: string) {
  return getProfileByWallet(walletAddress);
}
