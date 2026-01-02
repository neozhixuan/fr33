"use server";

import { LocalAccountSigner, sepolia } from "@alchemy/aa-core";
import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy";
import { generatePrivateKey } from "viem/accounts";

/**
 * Creates an ERC-4337 smart account for a user.
 * Returns both the smart account address and the owner's private key
 */
export async function createSmartAccount(): Promise<{
  smartAccountAddress: string;
  ownerPrivateKey: string;
}> {
  // Generate a new EOA private key for this user
  // TODO: Replace with deterministic key derivation from user credentials
  const ownerPrivateKey = generatePrivateKey();

  // Create a signer from the private key
  const signer = LocalAccountSigner.privateKeyToAccountSigner(ownerPrivateKey);

  // Create the Alchemy client with Modular Account
  const client = await createModularAccountAlchemyClient({
    apiKey: process.env.ALCHEMY_API_KEY!,
    chain: sepolia,
    signer,
  });

  const smartAccountAddress = client.getAddress();

  console.log(
    "[createSmartAccount] Smart Account created:",
    smartAccountAddress
  );
  console.log("[createSmartAccount] Owner EOA:", await signer.getAddress());

  return {
    smartAccountAddress,
    ownerPrivateKey,
  };
}
