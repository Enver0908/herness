import { buildSourceContext, rankKnowledgeSources, type KnowledgeSource } from "../knowledge";
import { getRiskLevel, shouldEscalate } from "../safety";
import { redactPii } from "./redaction";

export type AiAutomationDecision = {
  category: string;
  risk: "low" | "medium" | "high";
  canAutoSend: boolean;
  confidence: number;
  reason: string;
  escalationReason?: string;
  piiDetected: boolean;
  redactedMessage: string;
  reply: string;
  sources: KnowledgeSource[];
};

const safeAcknowledgement =
  "Thanks for your message. This needs a manager review, and we will follow up as soon as possible.";

export function decideGuestAutomation(input: {
  guestMessage: string;
  knowledgeSources: KnowledgeSource[];
  propertyName: string;
}) {
  const redaction = redactPii(input.guestMessage);
  const sources = rankKnowledgeSources(redaction.redactedText, input.knowledgeSources);
  const category = categorize(redaction.redactedText);
  const blockedReason = getBlockedReason(redaction.redactedText, redaction.piiDetected);

  if (blockedReason) {
    const calculatedRisk = blockedReason === "privacy_or_identity" ? "high" : getRiskLevel(redaction.redactedText);

    return {
      canAutoSend: false,
      category,
      confidence: 0.95,
      escalationReason: blockedReason,
      piiDetected: redaction.piiDetected,
      reason: `Blocked by ${blockedReason}.`,
      redactedMessage: redaction.redactedText,
      reply: safeAcknowledgement,
      risk: calculatedRisk === "low" ? "high" : calculatedRisk,
      sources,
    } satisfies AiAutomationDecision;
  }

  if (sources.length === 0) {
    return {
      canAutoSend: false,
      category: "missing_knowledge",
      confidence: 0.9,
      escalationReason: "missing_approved_source",
      piiDetected: redaction.piiDetected,
      reason: "No approved property knowledge matched the guest question.",
      redactedMessage: redaction.redactedText,
      reply: safeAcknowledgement,
      risk: "medium",
      sources,
    } satisfies AiAutomationDecision;
  }

  return {
    canAutoSend: true,
    category,
    confidence: 0.82,
    piiDetected: redaction.piiDetected,
    reason: "Low-risk guest operations question with approved property knowledge.",
    redactedMessage: redaction.redactedText,
    reply: "",
    risk: "low",
    sources,
  } satisfies AiAutomationDecision;
}
export function buildAutoReplyPrompt(input: {
  decision: AiAutomationDecision;
  guestLanguage: string;
  propertyName: string;
  settings?: {
    quietHoursStart: string;
    quietHoursEnd: string;
    wasteSortingRules: string;
    localTouristTaxCzk: number;
    otherRules: string;
  };
}) {
  const quietStart = input.settings?.quietHoursStart ?? "22:00";
  const quietEnd = input.settings?.quietHoursEnd ?? "06:00";
  const wasteRules = input.settings?.wasteSortingRules ?? "Sort waste: blue (paper), yellow (plastic), green/glass, orange (beverage cartons), black (mixed municipal waste).";
  const localTax = input.settings?.localTouristTaxCzk ?? 50;
  const otherRules = input.settings?.otherRules ?? "Quiet hours must be respected. Under no circumstances should tourist taxes be waived.";

  return [
    "You are HostOps CZ, an automated guest operations assistant for short-term rentals in Prague, Czech Republic.",
    "Your responses must strictly comply with local Prague policies and Czech short-term rental guidelines:",
    `- Respect quiet hours (noční klid) from ${quietStart} to ${quietEnd} as mandated by local laws.`,
    `- Adhere to waste sorting guidelines in Prague: ${wasteRules}`,
    `- Under no circumstances should you agree to waive city tourist taxes (current rate: ${localTax} CZK per night) or provide legal/compliance advice regarding foreign police registration.`,
    `- Additional operational rules: ${otherRules}`,
    "Write a concise, friendly, and professional reply that can be sent directly to the guest.",
    "Use only the approved property knowledge sources below. Do not invent details or assume anything not written in the sources.",
    "Do not mention passport, date of birth, nationality, visa, identity data, refunds, compensation, legal advice, police, or emergencies.",
    "If the approved sources do not answer the question, say a manager will follow up.",
    `Property: ${input.propertyName}`,
    `Guest language: ${input.guestLanguage}`,
    `Guest message with PII removed: ${input.decision.redactedMessage}`,
    buildSourceContext(input.decision.sources),
  ].join("\n\n");
}
export function safeEscalationReply() {
  return safeAcknowledgement;
}

function categorize(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("wifi") || normalized.includes("internet")) return "wifi";
  if (normalized.includes("park")) return "parking";
  if (normalized.includes("check-in") || normalized.includes("check in")) return "check_in";
  if (normalized.includes("check-out") || normalized.includes("check out")) return "check_out";
  if (normalized.includes("heat") || normalized.includes("heating")) return "appliance";
  return "guest_operations";
}

function getBlockedReason(message: string, piiDetected: boolean) {
  if (piiDetected) return "privacy_or_identity";
  if (shouldEscalate(message)) return "policy_or_safety";
  return null;
}
