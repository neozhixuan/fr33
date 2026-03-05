export const initConfig = () => {
  if (!process.env.NEXT_ESCROW_CONTRACT_ADDRESS)
    throw new Error(
      "NEXT_ESCROW_CONTRACT_ADDRESS environment variable not set",
    );
  if (!process.env.NEXT_ADMIN_PRIVATE_KEY)
    throw new Error("NEXT_ADMIN_PRIVATE_KEY environment variable not set");
  if (!process.env.NEXT_RPC_URL)
    throw new Error("NEXT_RPC_URL environment variable not set");
  if (!process.env.NEXT_ALCHEMY_API_KEY)
    throw new Error(
      "[createSmartAccount] Missing NEXT_ALCHEMY_API_KEY in environment variables",
    );
  if (!process.env.NEXT_ALCHEMY_GAS_POLICY_ID)
    throw new Error(
      "[createSmartAccount] Missing NEXT_ALCHEMY_GAS_POLICY_ID in environment variables",
    );
  if (!process.env.NEXT_VC_REGISTRY_ADDRESS)
    throw new Error("NEXT_VC_REGISTRY_ADDRESS environment variable not set");
};
