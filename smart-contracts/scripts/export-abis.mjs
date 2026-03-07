/**
 * Reads all Hardhat artifact JSON files produced by `npx hardhat compile` and
 * writes a generated TypeScript file directly into each consuming service:
 *
 *   ../main/utils/abis.generated.ts
 *   ../compliance-service/src/utils/abis.generated.ts
 *
 * Each service imports from this file instead of hard-coding ABIs.
 *
 * Run manually with:  node scripts/export-abis.mjs
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  mkdirSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enter the "/artifacts/contracts" directory where Hardhat outputs compiled contract JSON files
const ARTIFACTS_DIR = join(__dirname, "..", "artifacts", "contracts");
const REPO_ROOT = join(__dirname, "..", "..");

// Paths inside each consuming service where the generated file will be written
const TARGETS = [
  join(REPO_ROOT, "main", "utils", "abis.generated.ts"),
  join(REPO_ROOT, "compliance-service", "src", "utils", "abis.generated.ts"),
];

// 1. Collect artifacts
/** Recursively find all *.json artifact files, skipping *.dbg.json */
function findArtifacts(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findArtifacts(full));
    } else if (entry.endsWith(".json") && !entry.endsWith(".dbg.json")) {
      results.push(full);
    }
  }

  if (results.length === 0) {
    console.error("ERROR: No artifact JSON files found in:", dir);
  }

  return results;
}

const contracts = findArtifacts(ARTIFACTS_DIR).map((p) => {
  const { contractName, abi } = JSON.parse(readFileSync(p, "utf-8"));
  return { contractName, abi };
});

if (contracts.length === 0) {
  console.error("ERROR: No artifacts found. Run `npx hardhat compile` first.");
  process.exit(1);
}

// 2. Generate content
const header = `// AUTO-GENERATED -- DO NOT EDIT MANUALLY
// Source of truth: smart-contracts/artifacts/
// Regenerate by running \`node scripts/export-abis.mjs\` inside smart-contracts/
// (after \`npx hardhat compile\`)
`;

const tsContent =
  header +
  "\n" +
  contracts
    .map(
      ({ contractName, abi }) =>
        `export const ${contractName}_ABI = ${JSON.stringify(
          abi,
          null,
          2,
        )} as const;\n`,
    )
    .join("\n");

// 3. Write into each service
for (const target of TARGETS) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, tsContent, "utf-8");
  console.log(`Written -> ${target}`);
}

console.log(
  `\nSUCCESS: Contracts exported: ${contracts
    .map((c) => c.contractName)
    .join(", ")}`,
);
