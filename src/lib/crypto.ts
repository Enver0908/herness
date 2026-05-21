import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const algorithm = "aes-256-gcm";

function getKey() {
  const secret = process.env.PII_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("PII_ENCRYPTION_KEY is required.");
  }

  return scryptSync(secret, "hostops-cz-pii", 32);
}

export function encryptPii(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptPii(payload: string) {
  const [iv, tag, encrypted] = payload.split(".");

  if (!iv || !tag || !encrypted) {
    throw new Error("Invalid encrypted payload.");
  }

  const decipher = createDecipheriv(algorithm, getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
