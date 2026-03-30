import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { network } from "hardhat";

const { ethers } = await network.connect();

type Measurement = {
  action: string;
  gasUsed: number;
  effectiveGasPriceWei: bigint;
  txFeeWei: bigint;
  txHash: string;
};

type ActionStats = {
  action: string;
  sampleCount: number;
  gasUsed: {
    avg: number;
    p95: number;
    min: number;
    max: number;
  };
  txFeeNative: {
    avg: string;
    p95: string;
    min: string;
    max: string;
  };
};

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    throw new Error("Cannot compute percentile for empty array");
  }

  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(rank, sorted.length - 1))];
}

function avg(values: number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot compute average for empty array");
  }

  return values.reduce((sum, current) => sum + current, 0) / values.length;
}

function formatEther(wei: bigint): string {
  return ethers.formatEther(wei);
}

function aggregate(action: string, data: Measurement[]): ActionStats {
  const gasValues = data.map((d) => d.gasUsed);
  const feeValues = data.map((d) => d.txFeeWei);

  const avgFeeWei =
    feeValues.reduce((acc, value) => acc + value, 0n) /
    BigInt(feeValues.length);
  const sortedFeeWei = [...feeValues].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const p95FeeWei = sortedFeeWei[Math.ceil(0.95 * sortedFeeWei.length) - 1];

  return {
    action,
    sampleCount: data.length,
    gasUsed: {
      avg: Number(avg(gasValues).toFixed(2)),
      p95: percentile(gasValues, 95),
      min: Math.min(...gasValues),
      max: Math.max(...gasValues),
    },
    txFeeNative: {
      avg: formatEther(avgFeeWei),
      p95: formatEther(p95FeeWei),
      min: formatEther(sortedFeeWei[0]),
      max: formatEther(sortedFeeWei[sortedFeeWei.length - 1]),
    },
  };
}

async function measure(
  action: string,
  sendTx: () => Promise<{ wait: () => Promise<any>; hash: string }>,
): Promise<Measurement> {
  const tx = await sendTx();
  const receipt = await tx.wait();

  if (!receipt) {
    throw new Error(`No receipt for action ${action}`);
  }

  const gasUsed = Number(receipt.gasUsed);
  const effectiveGasPriceWei = BigInt(
    receipt.effectiveGasPrice ?? receipt.gasPrice ?? 0n,
  );
  const txFeeWei = receipt.gasUsed * effectiveGasPriceWei;

  return {
    action,
    gasUsed,
    effectiveGasPriceWei,
    txFeeWei,
    txHash: tx.hash,
  };
}

async function main() {
  const sampleCount = Number(process.env.SAMPLES ?? "30");
  if (!Number.isFinite(sampleCount) || sampleCount <= 0) {
    throw new Error("SAMPLES must be a positive number");
  }

  const [admin, employer, worker] = await ethers.getSigners();
  const JobEscrow = await ethers.getContractFactory("JobEscrow");
  const escrow = await JobEscrow.connect(admin).deploy();

  const records: Measurement[] = [];
  let jobId = 1;

  // 1) Escrow creation/funding
  for (let i = 0; i < sampleCount; i++) {
    const currentJobId = jobId++;
    records.push(
      await measure("escrow_creation_or_funding", () =>
        escrow
          .connect(employer)
          .fundJob(currentJobId, { value: ethers.parseEther("0.1") }),
      ),
    );
  }

  // 2) Release-related execution (approveRelease)
  for (let i = 0; i < sampleCount; i++) {
    const currentJobId = jobId++;
    await escrow
      .connect(employer)
      .fundJob(currentJobId, { value: ethers.parseEther("0.1") });
    await escrow.connect(worker).acceptJob(currentJobId);
    await escrow.connect(worker).requestRelease(currentJobId);

    records.push(
      await measure("release_related_execution", () =>
        escrow.connect(employer).approveRelease(currentJobId),
      ),
    );
  }

  // 3a) Dispute transition: openDispute
  for (let i = 0; i < sampleCount; i++) {
    const currentJobId = jobId++;
    await escrow
      .connect(employer)
      .fundJob(currentJobId, { value: ethers.parseEther("0.1") });
    await escrow.connect(worker).acceptJob(currentJobId);
    await escrow.connect(worker).requestRelease(currentJobId);

    records.push(
      await measure("dispute_transition_open", () =>
        escrow.connect(worker).openDispute(currentJobId),
      ),
    );
  }

  // 3b) Dispute transition: resolveDispute
  for (let i = 0; i < sampleCount; i++) {
    const currentJobId = jobId++;
    await escrow
      .connect(employer)
      .fundJob(currentJobId, { value: ethers.parseEther("0.1") });
    await escrow.connect(worker).acceptJob(currentJobId);
    await escrow.connect(worker).requestRelease(currentJobId);
    await escrow.connect(worker).openDispute(currentJobId);

    records.push(
      await measure("dispute_transition_resolve", () =>
        escrow.connect(admin).resolveDispute(currentJobId, 0, 0, "benchmark"),
      ),
    );
  }

  const grouped = new Map<string, Measurement[]>();
  for (const record of records) {
    const arr = grouped.get(record.action) ?? [];
    arr.push(record);
    grouped.set(record.action, arr);
  }

  const report = [...grouped.entries()].map(([action, data]) =>
    aggregate(action, data),
  );

  console.table(
    report.map((row) => ({
      action: row.action,
      sampleCount: row.sampleCount,
      gasAvg: row.gasUsed.avg,
      gasP95: row.gasUsed.p95,
      feeNativeAvg: row.txFeeNative.avg,
      feeNativeP95: row.txFeeNative.p95,
    })),
  );

  const outDir = path.resolve("reports", "benchmarks");
  await mkdir(outDir, { recursive: true });

  const outPath = path.join(outDir, `onchain-cost-report-${Date.now()}.json`);
  await writeFile(
    outPath,
    JSON.stringify(
      {
        network: network.name,
        generatedAt: new Date().toISOString(),
        sampleCount,
        report,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(`Saved report to ${outPath}`);
}

await main();
