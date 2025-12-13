import { prisma } from "@/lib/db";
import { KycDataDTO } from "@/types";
import type { users } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Creates a row for the user in DB, with hashed password
 */
export async function createUserAfterPasswordHash(
  email: string,
  password: string
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await prisma.users.create({
      data: {
        email: email,
        password: hashedPassword,
      },
    });
  } catch (error) {
    console.error("Failed to create user, err:", error);
    throw new Error("Failed to create user, err: " + error);
  }
}

/**
 * Use the unique key `email` to fetch user
 */
export async function getUserByEmail(
  email: string
): Promise<users | undefined> {
  try {
    const user = (await prisma.users.findUnique({
      where: { email: email },
    })) as users | null;

    if (!user) {
      return undefined;
    }

    return user;
  } catch (error) {
    console.error("Failed to fetch user by email:", error);
    throw new Error("Failed to fetch user by email.");
  }
}

/**
 * Updates user's KYC information
 */
export async function updateUserKYCInformation(
  email: string,
  kycDataDTO: KycDataDTO
) {
  try {
    if (kycDataDTO === null) {
      throw new Error("KYC data cannot be null");
    }

    const hashedID = await bcrypt.hash(kycDataDTO.idNumber, 10);

    const dob = new Date(kycDataDTO.dob);

    // Update the user's kyc information
    await prisma.users.update({
      where: { email: email },
      data: {
        fullName: kycDataDTO.fullName,
        kycVerified: kycDataDTO.kycVerified,
        idType: kycDataDTO.idType,
        idHash: hashedID,
        dob: dob,
        kycTimestamp: kycDataDTO.kycTimestamp,
      },
    });
  } catch (error) {
    console.error("Failed to update user's KYC information, err:", error);
    throw new Error("Failed to update user's KYC information, err: " + error);
  }
}

/**
 * Updates user's wallet information after smart account creation
 * Stores the wallet address and encrypted private key
 */
export async function updateUserWalletInformation(
  email: string,
  walletAddress: string,
  encryptedPrivKey: string
) {
  try {
    await prisma.users.update({
      where: { email: email },
      data: {
        walletAddress,
        encryptedPrivKey,
        registrationStep: 3,
      },
    });
  } catch (error) {
    console.error("Failed to update user's wallet information, err:", error);
    throw new Error(
      "Failed to update user's wallet information, err: " + error
    );
  }
}
