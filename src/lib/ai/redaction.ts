export type RedactionResult = {
  redactedText: string;
  piiDetected: boolean;
};

const patterns = [
  /\b[A-Z0-9]{6,12}\b/g,
  /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g,
  /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
];

const piiTerms = [
  "passport",
  "date of birth",
  "birth date",
  "nationality",
  "visa",
  "identity",
  "id card",
  "dob",
];

export function redactPii(input: string): RedactionResult {
  let redactedText = input;
  let piiDetected = piiTerms.some((term) => input.toLowerCase().includes(term));

  for (const pattern of patterns) {
    redactedText = redactedText.replace(pattern, () => {
      piiDetected = true;
      return "[REDACTED]";
    });
  }

  return { piiDetected, redactedText };
}
