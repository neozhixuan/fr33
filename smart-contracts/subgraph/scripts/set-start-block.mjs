import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SUBGRAPH_YAML_PATH = resolve(process.cwd(), "subgraph.yaml");
const ENV_PATH = resolve(process.cwd(), ".env");

function parseEnvFile(path) {
  if (!existsSync(path)) return {};

  const content = readFileSync(path, "utf-8");
  const out = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const idx = line.indexOf("=");
    if (idx <= 0) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

async function getLatestBlockNumber(rpcUrl) {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_blockNumber",
    params: [],
  };

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`RPC HTTP error ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`RPC error ${data.error.code}: ${data.error.message}`);
  }

  return Number.parseInt(data.result, 16);
}

async function main() {
  const envFromFile = parseEnvFile(ENV_PATH);
  const rpcUrl =
    process.env.POLYGON_AMOY_RPC_URL || envFromFile.POLYGON_AMOY_RPC_URL;

  if (!rpcUrl) {
    throw new Error("POLYGON_AMOY_RPC_URL is not set (env or .env)");
  }

  const offset = Number.parseInt(
    process.env.SUBGRAPH_START_BLOCK_OFFSET || "20",
    10,
  );
  const safeOffset = Number.isNaN(offset) ? 20 : Math.max(0, offset);

  const latest = await getLatestBlockNumber(rpcUrl);
  const startBlock = Math.max(0, latest - safeOffset);

  const yaml = readFileSync(SUBGRAPH_YAML_PATH, "utf-8");
  const nextYaml = yaml.replace(
    /startBlock:\s*\d+/,
    `startBlock: ${startBlock}`,
  );

  if (yaml === nextYaml) {
    console.log(`[subgraph] startBlock already ${startBlock}`);
  } else {
    writeFileSync(SUBGRAPH_YAML_PATH, nextYaml, "utf-8");
    console.log(
      `[subgraph] Updated startBlock to ${startBlock} (latest: ${latest}, offset: ${safeOffset})`,
    );
  }
}

main().catch((error) => {
  console.error("[subgraph] Failed to set startBlock:", error.message);
  process.exit(1);
});
