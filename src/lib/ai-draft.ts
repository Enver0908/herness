import { shouldEscalate } from "./safety";
import { buildSourceContext, rankKnowledgeSources, type KnowledgeSource } from "./knowledge";

export type DraftInput = {
  guestMessage: string;
  guestLanguage: string;
  propertyName: string;
  knowledgeSources: KnowledgeSource[];
};

const piiTerms = [
  "passport",
  "date of birth",
  "birth date",
  "nationality",
  "visa",
  "identity",
  "id card",
];

export function buildAiDraftPrompt(input: DraftInput) {
  const rankedSources = rankKnowledgeSources(input.guestMessage, input.knowledgeSources);

  if (shouldEscalate(input.guestMessage) || containsPiiRequest(input.guestMessage)) {
    return {
      blockedReason: "needs_human_review",
      prompt: null,
      sources: rankedSources,
    };
  }

  if (rankedSources.length === 0) {
    return {
      blockedReason: "missing_approved_source",
      prompt: null,
      sources: rankedSources,
    };
  }

  return {
    blockedReason: null,
    prompt: [
      "You are HostOps CZ, a guest operations assistant for short-term rentals in Prague.",
      "Write a concise, friendly draft reply for an operator to review.",
      "Use only the approved property knowledge sources below.",
      "Do not mention passport, date of birth, nationality, visa, or identity data.",
      "Do not offer refunds, discounts, legal advice, or emergency instructions.",
      `Property: ${input.propertyName}`,
      `Guest language: ${input.guestLanguage}`,
      `Guest message: ${input.guestMessage}`,
      buildSourceContext(rankedSources),
    ].join("\n\n"),
    sources: rankedSources,
  };
}

function containsPiiRequest(message: string) {
  const normalized = message.toLowerCase();
  return piiTerms.some((term) => normalized.includes(term));
}
