import { PrismaClient } from "../generated/prisma-client";

declare global {
  // eslint-disable-next-line no-var
  var prismaCompliance: PrismaClient | undefined;
}

export const prisma =
  global.prismaCompliance ||
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prismaCompliance = prisma;
}
