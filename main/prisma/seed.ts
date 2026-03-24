import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  OnboardingStage,
  PrismaClient,
  UserRole,
} from "../generated/prisma-client";

const prisma = new PrismaClient();

// Creates an admin user, and adds '@gmail.com' suffix if email not specified.
function resolveAdminEmailFromUsername(username: string) {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed) {
    throw new Error("ADMIN_USERNAME cannot be empty");
  }

  return trimmed.includes("@") ? trimmed : `${trimmed}@gmail.com`;
}

// Seeding function
async function seedAdminUser() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.warn(
      "[seed] Skipping admin user seed. Set ADMIN_USERNAME and ADMIN_PASSWORD in main/.env to enable it.",
    );
    return;
  }

  const email = resolveAdminEmailFromUsername(adminUsername);
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      onboardingStage: OnboardingStage.COMPLETED,
    },
    create: {
      email,
      passwordHash,
      role: UserRole.ADMIN,
      onboardingStage: OnboardingStage.COMPLETED,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log(
    "[seed] Admin user ready:",
    `id=${admin.id}`,
    `email=${admin.email}`,
    `role=${admin.role}`,
  );
}

async function main() {
  await seedAdminUser();
}

main()
  .catch((error) => {
    console.error("[seed] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
