import { describe, expect, it } from "vitest";
import { decryptPii, encryptPii } from "./crypto";

describe("PII encryption", () => {
  it("round-trips a sensitive value without storing plaintext", () => {
    process.env.PII_ENCRYPTION_KEY = "test-encryption-key";

    const encrypted = encryptPii("P123456");

    expect(encrypted).not.toContain("P123456");
    expect(decryptPii(encrypted)).toBe("P123456");
  });
});
