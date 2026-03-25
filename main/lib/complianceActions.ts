"use server";

import {
  findWalletsByAddresses,
  listAuditLogsPage,
  listVCMetadataPage,
  markVCMetadataRevokedByHash,
} from "@/model/compliance";
import {
  ComplianceCase,
  ComplianceProfile,
  ComplianceRuleTrigger,
  EscrowEventTypes,
  ListCasesResponse,
  MainServiceAuditLog,
  MonitoringLog,
  VCInventoryPage,
} from "@/type/complianceTypes";

const COMPLIANCE_SERVICE_URL =
  process.env.COMPLIANCE_SERVICE_URL || "http://localhost:3001";

async function markLocalVCMetadataRevoked(vcHash: string): Promise<void> {
  await markVCMetadataRevokedByHash(vcHash);
}

// List all compliance cases with optional filters
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

  const payload = (await res.json()) as {
    cases?: ComplianceCase[];
    total?: number;
  };
  const cases = Array.isArray(payload?.cases) ? payload.cases : [];

  const walletAddresses = Array.from(
    new Set(
      cases
        .map((c) => c.profile?.walletAddress?.toLowerCase())
        .filter((w): w is string => Boolean(w)),
    ),
  );

  const wallets = await findWalletsByAddresses(walletAddresses);

  const walletByAddress = new Map(
    wallets.map((w) => [w.address.toLowerCase(), w]),
  );

  const enrichedCases: ComplianceCase[] = cases.map((c) => {
    const walletAddress = c.profile?.walletAddress?.toLowerCase();
    const wallet = walletAddress
      ? walletByAddress.get(walletAddress)
      : undefined;

    return {
      ...c,
      account: wallet
        ? {
            walletId: wallet.id,
            address: wallet.address,
            did: wallet.did,
            walletStatus: wallet.status,
            walletCreatedAt: wallet.createdAt.toISOString(),
            user: {
              id: wallet.user.id,
              email: wallet.user.email,
              role: wallet.user.role,
              onboardingStage: wallet.user.onboardingStage,
              createdAt: wallet.user.createdAt.toISOString(),
            },
            vcMetadata: wallet.vcMetadata
              ? {
                  vcHash: wallet.vcMetadata.vcHash,
                  status: wallet.vcMetadata.status,
                  issuedAt: wallet.vcMetadata.issuedAt.toISOString(),
                  expiresAt: wallet.vcMetadata.expiresAt.toISOString(),
                  revokedAt: wallet.vcMetadata.revokedAt
                    ? wallet.vcMetadata.revokedAt.toISOString()
                    : null,
                }
              : null,
          }
        : null,
    };
  });

  return {
    cases: enrichedCases,
    total: payload?.total ?? enrichedCases.length,
  };
}

// Service function to get compliance profile of a wallet
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

// Service function to dismiss a compliance case by its ID
export async function dismissComplianceCase(
  caseId: number,
  notes?: string,
): Promise<ComplianceCase> {
  const url = `${COMPLIANCE_SERVICE_URL}/compliance/cases/${caseId}/dismiss`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });

  if (!res.ok) {
    throw new Error(`Failed to dismiss case: ${res.statusText}`);
  }

  return res.json();
}

// Service function to revoke a VC by its hash,
// which also marks the associated compliance case as actioned with the provided notes.
export async function revokeVCForCase(
  caseId: number,
  vcHash: string,
  notes?: string,
): Promise<ComplianceCase> {
  const url = `${COMPLIANCE_SERVICE_URL}/compliance/cases/${caseId}/revoke-vc`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vcHash, notes }),
  });

  if (!res.ok) {
    throw new Error(`Failed to revoke VC: ${res.statusText}`);
  }

  await markLocalVCMetadataRevoked(vcHash);

  return res.json();
}

// Service function to revoke any VC by its hash, with optional notes
export async function revokeVCManually(
  vcHash: string,
  notes?: string,
): Promise<{ vcHash: string; txHash: string; notes: string }> {
  const url = `${COMPLIANCE_SERVICE_URL}/compliance/vc/revoke`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vcHash, notes }),
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const payload = (await res.json()) as {
        error?: string;
        message?: string;
      };
      errorDetail = payload.error || payload.message || errorDetail;
    } catch {
      try {
        const text = await res.text();
        if (text) {
          errorDetail = text;
        }
      } catch {
        // no-op: keep status text fallback
      }
    }

    throw new Error(`Failed to revoke VC: ${errorDetail}`);
  }

  await markLocalVCMetadataRevoked(vcHash);

  return res.json();
}

// Service function to list VC inventory with optional filters
export async function listVCInventory(filters?: {
  page?: number;
  pageSize?: number;
  status?: "VALID" | "EXPIRED" | "REVOKED";
}): Promise<VCInventoryPage> {
  const page = Math.max(filters?.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters?.pageSize ?? 20, 1), 100);
  const skip = (page - 1) * pageSize;
  const { rows, total } = await listVCMetadataPage({
    status: filters?.status,
    skip,
    take: pageSize,
  });

  return {
    rows: rows.map((row) => ({
      walletId: row.wallet.id,
      walletAddress: row.wallet.address,
      walletDid: row.wallet.did,
      userId: row.wallet.user.id,
      userEmail: row.wallet.user.email,
      userRole: row.wallet.user.role,
      vcHash: row.vcHash,
      status: row.status,
      issuedAt: row.issuedAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
    })),
    total,
    page,
    pageSize,
  };
}

// Service function to list audit logs in main service
export async function listMainServiceAuditLogs(filters?: {
  limit?: number;
  offset?: number;
}): Promise<{ logs: MainServiceAuditLog[]; total: number }> {
  const take = Math.min(Math.max(filters?.limit ?? 100, 1), 500);
  const skip = Math.max(filters?.offset ?? 0, 0);
  const { logs, total } = await listAuditLogsPage({ skip, take });

  return {
    logs: logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userEmail: log.user?.email ?? null,
      action: log.action,
      result: log.result,
      walletAddress: log.walletAddress,
      ipAddress: log.ipAddress,
      metadata: (log.metadata as Record<string, unknown> | null) ?? null,
      createdAt: log.createdAt.toISOString(),
    })),
    total,
  };
}

export async function listMonitoringLogs(filters?: {
  wallet?: string;
  eventType?: EscrowEventTypes;
  limit?: number;
  offset?: number;
}): Promise<{ logs: MonitoringLog[] }> {
  const params = new URLSearchParams();
  if (filters?.wallet) params.append("wallet", filters.wallet);
  if (filters?.eventType) params.append("eventType", filters.eventType);
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.offset) params.append("offset", String(filters.offset));

  const url = `${COMPLIANCE_SERVICE_URL}/compliance/monitoring-logs?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch monitoring logs: ${res.statusText}`);
  }

  return res.json();
}
