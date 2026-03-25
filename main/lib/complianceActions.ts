"use server";

const COMPLIANCE_SERVICE_URL =
  process.env.COMPLIANCE_SERVICE_URL || "http://localhost:3001";

// Type definitions based on compliance service schema
export interface ComplianceProfile {
  id: number;
  walletAddress: string;
  cumulativeScore: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRuleTrigger {
  id: number;
  profileId: number;
  ruleName: string;
  scoreDelta: number;
  threshold: Record<string, unknown>;
  observed: Record<string, unknown>;
  sourceEventId?: string;
  sourceTxHash?: string;
  triggeredAt: string;
}

export interface ComplianceCase {
  id: number;
  profileId: number;
  profile?: ComplianceProfile;
  status: "OPEN" | "DISMISSED" | "ACTIONED";
  scoreAtCreation: number;
  triggeredRules: string[];
  evidence: Record<string, unknown>;
  actionNotes?: string | null;
  actionTxHash?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  ruleTriggers?: ComplianceRuleTrigger[];
}

export interface ListCasesResponse {
  cases: ComplianceCase[];
  total: number;
}

export async function listComplianceCases(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ListCasesResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.offset) params.append("offset", String(filters.offset));

  const url = `${COMPLIANCE_SERVICE_URL}/compliance/cases?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch compliance cases: ${res.statusText}`);
  }

  return res.json();
}

export async function getComplianceProfile(
  walletAddress: string,
): Promise<ComplianceProfile & { ruleTriggers?: ComplianceRuleTrigger[] }> {
  const url = `${COMPLIANCE_SERVICE_URL}/compliance/profiles/${walletAddress}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch compliance profile: ${res.statusText}`);
  }

  return res.json();
}

export async function dismissComplianceCase(
  caseId: number,
  notes?: string,
): Promise<ComplianceCase> {
  const url = `${COMPLIANCE_SERVICE_URL}/compliance/cases/${caseId}/dismiss`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actionNotes: notes }),
  });

  if (!res.ok) {
    throw new Error(`Failed to dismiss case: ${res.statusText}`);
  }

  return res.json();
}

export async function revokeVCForCase(
  caseId: number,
  notes?: string,
): Promise<ComplianceCase> {
  const url = `${COMPLIANCE_SERVICE_URL}/compliance/cases/${caseId}/revoke-vc`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actionNotes: notes }),
  });

  if (!res.ok) {
    throw new Error(`Failed to revoke VC: ${res.statusText}`);
  }

  return res.json();
}
