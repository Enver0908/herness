import { describe, expect, it } from "vitest";
import { estimateMinutesSaved, shouldEscalate, getRiskLevel } from "./safety";

describe("message safety gate", () => {
  it("allows routine property questions to be handled automatically", () => {
    expect(shouldEscalate("What is the Wi-Fi password?")).toBe(false);
    expect(shouldEscalate("Where can I park near the apartment?")).toBe(false);
  });

  it("escalates complaints, refunds, and personal document requests", () => {
    expect(shouldEscalate("I want a refund because heating is not working")).toBe(true);
    expect(shouldEscalate("Can I send my passport number here?")).toBe(true);
  });

  it("determines risk level correctly based on terms", () => {
    expect(getRiskLevel("What is the Wi-Fi password?")).toBe("low");
    expect(getRiskLevel("The sink is leaking and there's a flood")).toBe("medium");
    expect(getRiskLevel("There is a fire and injury, please call police")).toBe("high");
  });
});

describe("operations ROI", () => {
  it("estimates saved minutes from auto-resolved messages", () => {
    expect(estimateMinutesSaved(8)).toBe(60);
  });
});
