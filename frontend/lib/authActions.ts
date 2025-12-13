"use server";

import { signIn } from "@/server/auth";
import {
  createUserAfterPasswordHash,
  updateUserKYCInformation,
  updateUserWalletInformation,
} from "@/model/user";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { KycDataDTO } from "@/types";
import { createSmartAccount } from "./aaActions";
import crypto from "crypto";

export async function authenticateAction(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    // Return err message
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return "Invalid credentials, err: " + error.message;
      }

      return "Something went wrong, err: " + (error.message || "Unknown error");
    }
    // Non-auth error
    throw error;
  }
}

export async function registrationAction(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    const email = formData.get("email")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    if (!email || !password) {
      return "Error: Please fill in all fields.";
    }

    await createUserAfterPasswordHash(email, password);
    redirect("/job-portal");
  } catch (error) {
    // Return err message
    if (error instanceof AuthError) {
      return "Something went wrong, err: " + (error.message || "Unknown error");
    }
    // Non-auth error
    throw error;
  }
}

export async function completeKyc(email: string, kycDataDTO: KycDataDTO) {
  try {
    await updateUserKYCInformation(email, kycDataDTO);
  } catch (error) {
    console.error("Failed to complete KYC, err: ", error);
    throw new Error("Failed to complete KYC, err: " + error);
  }
}

/**
 * Creates a smart account for the user after KYC completion
 * Encrypts and stores the private key in the database
 *
 * @param email - User's email address
 */
export async function createSmartAccountForUser(email: string) {
  try {
    // Create the smart account
    const { smartAccountAddress, ownerPrivateKey } = await createSmartAccount();

    // Encrypt the private key before storing
    const encryptionKey = process.env.WALLET_ENCRYPTION_KEY!;
    if (!encryptionKey) {
      throw new Error("WALLET_ENCRYPTION_KEY not configured");
    }

    // Derive a 32-byte key from the encryption key
    const key = crypto.scryptSync(encryptionKey, "salt", 32);

    // Generate a random initialization vector (IV)
    const iv = crypto.randomBytes(16);

    // Create cipher using AES-256-CBC
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encryptedPrivKey = cipher.update(ownerPrivateKey, "utf8", "hex");
    encryptedPrivKey += cipher.final("hex");

    // Prepend IV to encrypted data (IV is not secret, needed for decryption)
    const encryptedWithIv = iv.toString("hex") + ":" + encryptedPrivKey;

    // Store wallet information in database
    await updateUserWalletInformation(
      email,
      smartAccountAddress,
      encryptedWithIv
    );

    console.log(
      `Smart account created for user ${email}: ${smartAccountAddress}`
    );
  } catch (error) {
    console.error("Failed to create smart account, err:", error);
    throw new Error("Failed to create smart account: " + error);
  }
}

/**
 * Decrypts a wallet private key from the database
 *
 * @param encryptedWithIv - The encrypted private key with IV prepended (format: "iv:encryptedData")
 * @returns The decrypted private key
 */
export async function decryptPrivateKey(
  encryptedWithIv: string
): Promise<string> {
  const encryptionKey = process.env.WALLET_ENCRYPTION_KEY!;
  if (!encryptionKey) {
    throw new Error("WALLET_ENCRYPTION_KEY not configured");
  }

  // Split IV and encrypted data
  const [ivHex, encryptedData] = encryptedWithIv.split(":");
  if (!ivHex || !encryptedData) {
    throw new Error("Invalid encrypted data format");
  }

  // Derive the same 32-byte key
  const key = crypto.scryptSync(encryptionKey, "salt", 32);

  // Convert IV from hex to Buffer
  const iv = Buffer.from(ivHex, "hex");

  // Create decipher
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
