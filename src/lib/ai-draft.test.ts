import { describe, expect, it } from "vitest";
import { buildAiDraftPrompt } from "./ai-draft";

const sources = [
  {
    body: "Guests can park at Kotva Garage, five minutes from the apartment.",
    id: "k1",
    title: "Parking",
  },
];

describe("AI draft prompt builder", () => {
  it("builds a sourced prompt for low-risk guest questions", () => {
    const result = buildAiDraftPrompt({
      guestLanguage: "English",
      guestMessage: "Where can I park?",
      knowledgeSources: sources,
      propertyName: "Old Town Loft",
    });

    expect(result.blockedReason).toBeNull();
    expect(result.prompt).toContain("Kotva Garage");
  });

  it("blocks PII requests from entering the model prompt", () => {
    const result = buildAiDraftPrompt({
      guestLanguage: "English",
      guestMessage: "Can I send my passport number here?",
      knowledgeSources: sources,
      propertyName: "Old Town Loft",
    });

    expect(result.blockedReason).toBe("needs_human_review");
    expect(result.prompt).toBeNull();
  });
});
