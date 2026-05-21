const escalationTerms = [
  "refund",
  "discount",
  "compensation",
  "police",
  "emergency",
  "injury",
  "passport",
  "visa",
  "broken",
  "not working",
  "complaint",
];

export function shouldEscalate(message: string) {
  const normalized = message.toLowerCase();
  return escalationTerms.some((term) => normalized.includes(term));
}

export function estimateMinutesSaved(autoResolvedMessages: number) {
  return Math.round(autoResolvedMessages * 7.5);
}
