import { prisma } from "@/lib/db";

// Using VC's hash, mark its metadata as revoked
export async function markVCMetadataRevokedByHash(
  vcHash: string,
): Promise<void> {
  const trimmed = vcHash.trim();
  const candidates = new Set<string>([trimmed]);

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    candidates.add(`0x${trimmed}`);
  }

  if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    candidates.add(trimmed.slice(2));
  }

  await prisma.vCMetadata.updateMany({
    where: {
      vcHash: {
        in: Array.from(candidates),
      },
    },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });
}

// Find wallets given these addresses
export async function findWalletsByAddresses(addresses: string[]) {
  if (!addresses.length) {
    return [];
  }

  return prisma.wallet.findMany({
    where: { address: { in: addresses } },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          onboardingStage: true,
          createdAt: true,
        },
      },
      vcMetadata: {
        select: {
          vcHash: true,
          status: true,
          issuedAt: true,
          expiresAt: true,
          revokedAt: true,
        },
      },
    },
  });
}

// List all VCs with these statuses and pagination
export async function listVCMetadataPage(params: {
  status?: "VALID" | "EXPIRED" | "REVOKED";
  skip: number;
  take: number;
}) {
  const where = {
    ...(params.status ? { status: params.status } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.vCMetadata.findMany({
      where,
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        issuedAt: "desc",
      },
      skip: params.skip,
      take: params.take,
    }),
    prisma.vCMetadata.count({ where }),
  ]);

  return { rows, total };
}

// List all audit logs with pagination
export async function listAuditLogsPage(params: {
  skip: number;
  take: number;
}) {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: params.take,
      skip: params.skip,
    }),
    prisma.auditLog.count(),
  ]);

  return { logs, total };
}
