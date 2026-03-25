import { getProfileByWallet } from "../../model/compliance.repository";
import {
  dismissComplianceCase,
  actionComplianceCase,
  listComplianceCases,
} from "../../model/compliance-case.repository";

import { revokeVcRegistryTx } from "../blockchain/blockchain.service";

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

  return actionComplianceCase(
    params.caseId,
    txHash,
    params.notes || "VC revoked by admin",
  );
}

// Service function to fetch a compliance profile associated with a wallet address.
export async function getWalletProfile(walletAddress: string) {
  return getProfileByWallet(walletAddress);
}
