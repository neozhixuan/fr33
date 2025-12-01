import { prisma } from "@/lib/db";
import type { users } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function createUserAfterPasswordHash(username: string, email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await prisma.users.create({
            data: {
                name: username,
                email: email,
                password: hashedPassword,
            },
        });
    } catch (error) {
        console.error("Failed to create user, err:", error);
        throw new Error("Failed to create user, err: " + (error));
    }
}

export async function getUserByEmail(email: string): Promise<users | undefined> {
    try {
        const user = await prisma.users.findUnique({
            where: { email: email },
        }) as users | null;

        if (!user) {
            return undefined;
        }

        return user;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error("Failed to fetch user.");
    }
}
