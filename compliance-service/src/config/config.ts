export const initConfig = () => {
  if (!process.env.VC_REGISTRY_ADDRESS)
    throw new Error("VC_REGISTRY_ADDRESS environment variable not set");
  if (!process.env.ISSUER_PRIVATE_KEY)
    throw new Error("ISSUER_PRIVATE_KEY environment variable not set");
  if (!process.env.RPC_URL)
    throw new Error("RPC_URL environment variable not set");
  if (!process.env.VC_SIGNING_PRIVATE_KEY)
    throw new Error("VC signing private key not configured");
};
