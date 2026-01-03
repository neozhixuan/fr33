import crypto from "crypto";

// Galois/Counter Mode ensures authenticated encryption (confidentiality + integrity)
const ALGORITHM = "aes-256-gcm";

/**
 * Takes a privateKey and returns its encrypted ciphertext along with the IV used for encryption.
 * @param privateKey
 * @returns { ciphertext: string; iv: string }
 */
export function encryptPrivateKey(privateKey: string) {
  if (!process.env.WALLET_ENCRYPTION_KEY) {
    throw new Error(
      "[encryptPrivateKey] Missing WALLET_ENCRYPTION_KEY in environment variables"
    );
  }

  // Build cipher
  const key = Buffer.from(process.env.WALLET_ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Build ciphertext using encryption + authTag
  const encryptedKey = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: Buffer.concat([encryptedKey, authTag]).toString("base64"),
    iv: iv.toString("hex"),
  };
}

/**
 * Decrypts the given ciphertext using the provided IV.
 * @param ciphertext
 * @param ivHex
 * @returns decryptedKey: string
 */
export function decryptPrivateKey(ciphertext: string, ivHex: string): string {
  if (!process.env.WALLET_ENCRYPTION_KEY) {
    throw new Error(
      "[decryptPrivateKey] Missing WALLET_ENCRYPTION_KEY in environment variables"
    );
  }

  const key = Buffer.from(process.env.WALLET_ENCRYPTION_KEY, "hex");
  const data = Buffer.from(ciphertext, "base64");
  const ivBuf = Buffer.from(ivHex, "hex");

  // Extract ciphertext and authTag
  const encrypted = data.slice(0, data.length - 16);
  const authTag = data.slice(data.length - 16);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuf);
  decipher.setAuthTag(authTag);

  // Decrypt ciphertext
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
