import sql from "@/lib/db";
import type { User } from "@/lib/definitions";
import bcrypt from "bcryptjs";

export async function createUserAfterPasswordHash(username: string, email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await sql`
      INSERT INTO users (name, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
    `;

    } catch (error) {
        console.error("Failed to create user, err:", error);
        throw new Error("Failed to create user, err: " + (error));
    }
}


export async function getUserByEmail(email: string): Promise<User | undefined> {
    try {
        const rows = await sql<User[]>`
      SELECT id, name, email, password, created_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

        console.log("test:" + rows)
        return rows[0] ?? null;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error("Failed to fetch user.");
    }
}
