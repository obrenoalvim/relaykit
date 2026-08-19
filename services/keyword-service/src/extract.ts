export interface Keyword {
  term: string;
  count: number;
}

const STOPWORDS = new Set([
  // English
  'the', 'is', 'are', 'and', 'of', 'to', 'in', 'that', 'it', 'was', 'for',
  'on', 'with', 'as', 'this', 'but', 'have', 'not', 'you', 'be', 'at', 'by',
  // Portuguese
  'o', 'a', 'os', 'as', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'uma',
  'para', 'com', 'não', 'é', 'foi', 'ao', 'se', 'na', 'no', 'dos', 'das',
  // Spanish
  'el', 'la', 'los', 'las', 'que', 'y', 'un', 'una', 'es', 'por', 'su',
  // French
  'le', 'les', 'des', 'un', 'une', 'est', 'que', 'pour', 'dans', 'ce',
  // German
  'der', 'die', 'das', 'und', 'ist', 'ein', 'eine', 'zu', 'den', 'von',
]);

const DEFAULT_LIMIT = 8;
const MIN_TERM_LENGTH = 3;

function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[\p{L}][\p{L}'-]*/gu);
  return matches ?? [];
}

export function extractKeywords(text: string, limit = DEFAULT_LIMIT): Keyword[] {
  const tokens = tokenize(text).filter(
    (token) => token.length >= MIN_TERM_LENGTH && !STOPWORDS.has(token),
  );

  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}
