import { describe, expect, it } from "vitest";
import { estimateMinutesSaved, shouldEscalate } from "./safety";

describe("message safety gate", () => {
  it("allows routine property questions to be handled automatically", () => {
    expect(shouldEscalate("What is the Wi-Fi password?")).toBe(false);
    expect(shouldEscalate("Where can I park near the apartment?")).toBe(false);
  });

  it("escalates complaints, refunds, and personal document requests", () => {
    expect(shouldEscalate("I want a refund because heating is not working")).toBe(true);
    expect(shouldEscalate("Can I send my passport number here?")).toBe(true);
  });
});

describe("operations ROI", () => {
  it("estimates saved minutes from auto-resolved messages", () => {
    expect(estimateMinutesSaved(8)).toBe(60);
  });
});
