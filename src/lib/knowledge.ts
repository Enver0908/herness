export type KnowledgeSource = {
  id: string;
  title: string;
  body: string;
};

export function rankKnowledgeSources(message: string, sources: KnowledgeSource[], limit = 3) {
  const messageTerms = tokenize(message);

  return sources
    .map((source) => ({
      score: scoreSource(messageTerms, source),
      source,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.source);
}

export function buildSourceContext(sources: KnowledgeSource[]) {
  return sources
    .map((source, index) => `Source ${index + 1}: ${source.title}\n${source.body}`)
    .join("\n\n");
}

function tokenize(input: string) {
  const terms =
    input
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 2);

  const expanded = terms.flatMap((term) => [term, ...(synonyms[term] ?? [])]);

  return new Set(expanded);
}

function scoreSource(messageTerms: Set<string>, source: KnowledgeSource) {
  const sourceTerms = tokenize(`${source.title} ${source.body}`);
  let score = 0;

  for (const term of messageTerms) {
    if (sourceTerms.has(term) || [...sourceTerms].some((sourceTerm) => sourceTerm.startsWith(term))) {
      score += 1;
    }
  }

  return score;
}

const synonyms: Record<string, string[]> = {
  aparcar: ["park", "parking"],
  aparcamiento: ["park", "parking"],
  calefaccion: ["heating", "heat"],
  garaje: ["garage", "parking"],
  heizung: ["heating", "heat"],
  internet: ["wifi", "wi", "fi"],
  parking: ["park", "garage", "aparcar"],
  parkplatz: ["parking", "park"],
  wifi: ["wi", "fi", "internet"],
};
