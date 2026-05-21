import { describe, expect, it } from "vitest";
import { redactPii } from "./redaction";

describe("PII redaction", () => {
  it("redacts email, phone, date-like values, and passport-like ids", () => {
    const result = redactPii("My passport AB123456 and email me@guest.com, phone +420 777 123 456, DOB 1990-01-02");

    expect(result.piiDetected).toBe(true);
    expect(result.redactedText).not.toContain("AB123456");
    expect(result.redactedText).not.toContain("me@guest.com");
    expect(result.redactedText).not.toContain("+420 777 123 456");
    expect(result.redactedText).not.toContain("1990-01-02");
  });
});
