import { prisma } from "@/lib/db";
import { OnboardingStage, User, UserRole } from "@prisma/client";
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
    await prisma.user.create({
      data: {
        email: email,
        passwordHash: hashedPassword,
        role: UserRole.WORKER,
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
export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const user = (await prisma.user.findUnique({
      where: { email: email },
    })) as User | null;

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
 * Check that the user has completed KYC in their current wallet
 * @param userId - User's unique ID
 */
export async function getUserIsCompliant(userId: number): Promise<boolean> {
  try {
    // For the current user, fetch all wallets and their VC metadata
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: {
          include: {
            vcMetadata: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if any wallet has valid VC
    return user.wallets.some(
      (wallet) =>
        wallet && wallet.vcMetadata && wallet.vcMetadata.status === "VALID"
    );
  } catch (error) {
    console.error("Failed to check user compliance:", error);
    throw new Error("Failed to check user compliance: " + error);
  }
}

export async function getUserOnboardingStatus(
  userId: number
): Promise<OnboardingStage | null> {
  try {
    // Fetch the current user's onboarding status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingStage: true },
    });
    if (!user) {
      return null;
    }

    return user.onboardingStage;
  } catch (error) {
    console.error("Failed to get user onboarding status:", error);
    throw new Error("Failed to get user onboarding status: " + error);
  }
}

export async function updateUserOnboardingStage(
  userId: number,
  newStage: OnboardingStage
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingStage: newStage },
    });
  } catch (error) {
    console.error("Failed to update user onboarding stage:", error);
    throw new Error("Failed to update user onboarding stage: " + error);
  }
}
