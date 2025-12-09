import { prisma } from "@/lib/db";
import { KycDataDTO } from "@/types";
import type { users } from "@prisma/client";
import bcrypt from "bcryptjs";

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
        registrationStep: 3,
      },
    });
  } catch (error) {
    console.error("Failed to update user's KYC information, err:", error);
    throw new Error("Failed to update user's KYC information, err: " + error);
  }
}
