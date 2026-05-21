const highRiskTerms = [
  "emergency",
  "fire",
  "injury",
  "hurt",
  "police",
  "medical",
  "hospital",
  "ambulance",
  "safety",
  "danger",
  "refund",
  "discount",
  "compensation",
  "sue",
  "lawyer",
  "illegal",
  "stolen",
  "theft",
  "passport",
  "visa",
];

const mediumRiskTerms = [
  "broken",
  "not working",
  "complaint",
  "damage",
  "leak",
  "flood",
  "dirty",
  "smell",
  "noise",
  "keys",
  "lost",
  "locked out",
];

export function getRiskLevel(message: string): "low" | "medium" | "high" {
  const normalized = message.toLowerCase();

  if (highRiskTerms.some((term) => normalized.includes(term))) {
    return "high";
  }

  if (mediumRiskTerms.some((term) => normalized.includes(term))) {
    return "medium";
  }

  return "low";
}

export function shouldEscalate(message: string) {
  return getRiskLevel(message) !== "low";
}

export function estimateMinutesSaved(autoResolvedMessages: number) {
  return Math.round(autoResolvedMessages * 7.5);
}
