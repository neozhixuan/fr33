export const initConfig = () => {
  if (!process.env.VC_REGISTRY_ADDRESS)
    throw new Error("VC_REGISTRY_ADDRESS environment variable not set");
  if (!process.env.ISSUER_PRIVATE_KEY)
    throw new Error("ISSUER_PRIVATE_KEY environment variable not set");
  if (!process.env.RPC_URL)
    throw new Error("RPC_URL environment variable not set");
  if (!process.env.VC_SIGNING_PRIVATE_KEY)
    throw new Error("VC signing private key not configured");

  const monitorEnabledRaw =
    process.env.COMPLIANCE_MONITOR_ENABLED?.toLowerCase() ?? "true";
  const monitorEnabled = ["true", "1", "yes", "y"].includes(monitorEnabledRaw);

  if (monitorEnabled && !process.env.COMPLIANCE_SUBGRAPH_URL)
    throw new Error(
      "COMPLIANCE_SUBGRAPH_URL environment variable not set while monitor is enabled",
    );
};
