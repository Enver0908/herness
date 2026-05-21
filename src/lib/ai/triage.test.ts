import { describe, expect, it } from "vitest";
import { decideGuestAutomation } from "./triage";

const sources = [
  {
    body: "The apartment WiFi network is HostOps-Guest and the password is Prague123.",
    id: "k1",
    title: "WiFi",
  },
];

describe("AI automation triage", () => {
  it("allows auto-send for low-risk sourced guest operations questions", () => {
    const decision = decideGuestAutomation({
      guestMessage: "What is the wifi password?",
      knowledgeSources: sources,
      propertyName: "Old Town Loft",
    });

    expect(decision.canAutoSend).toBe(true);
    expect(decision.risk).toBe("low");
    expect(decision.sources).toHaveLength(1);
  });

  it("blocks auto-send for privacy or identity messages", () => {
    const decision = decideGuestAutomation({
      guestMessage: "Can I send my passport AB123456 here?",
      knowledgeSources: sources,
      propertyName: "Old Town Loft",
    });

    expect(decision.canAutoSend).toBe(false);
    expect(decision.escalationReason).toBe("privacy_or_identity");
  });

  it("blocks auto-send when no approved source matches", () => {
    const decision = decideGuestAutomation({
      guestMessage: "Where is the nearest tram stop?",
      knowledgeSources: [],
      propertyName: "Old Town Loft",
    });

    expect(decision.canAutoSend).toBe(false);
    expect(decision.escalationReason).toBe("missing_approved_source");
  });

  it("opens the escalation path for refund and complaint messages", () => {
    const decision = decideGuestAutomation({
      guestMessage: "I want a refund because this is a complaint about the apartment.",
      knowledgeSources: sources,
      propertyName: "Old Town Loft",
    });

    expect(decision.canAutoSend).toBe(false);
    expect(decision.escalationReason).toBe("policy_or_safety");
    expect(decision.risk).toBe("high");
  });
});
