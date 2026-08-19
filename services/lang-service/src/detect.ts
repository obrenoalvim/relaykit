export type LanguageCode = 'en' | 'pt' | 'es' | 'fr' | 'de' | 'und';
export type Confidence = 'high' | 'medium' | 'low';

export interface LanguageResult {
  language: LanguageCode;
  confidence: Confidence;
  scores: Record<Exclude<LanguageCode, 'und'>, number>;
}

const STOPWORDS: Record<Exclude<LanguageCode, 'und'>, Set<string>> = {
  en: new Set([
    'the', 'is', 'are', 'and', 'of', 'to', 'in', 'that', 'it', 'was',
    'for', 'on', 'with', 'as', 'this', 'but', 'have', 'not', 'you', 'be',
  ]),
  pt: new Set([
    'o', 'a', 'os', 'as', 'de', 'que', 'e', 'do', 'da', 'em',
    'um', 'uma', 'para', 'com', 'não', 'é', 'foi', 'ao', 'se', 'na',
  ]),
  es: new Set([
    'el', 'la', 'los', 'las', 'de', 'que', 'y', 'en', 'un', 'una',
    'es', 'por', 'con', 'para', 'no', 'se', 'su', 'del', 'al', 'lo',
  ]),
  fr: new Set([
    'le', 'la', 'les', 'de', 'des', 'et', 'un', 'une', 'est', 'en',
    'que', 'pour', 'dans', 'ce', 'qui', 'ne', 'pas', 'sur', 'au', 'avec',
  ]),
  de: new Set([
    'der', 'die', 'das', 'und', 'ist', 'ein', 'eine', 'zu', 'den', 'von',
    'nicht', 'mit', 'sich', 'auf', 'für', 'im', 'dem', 'des', 'als', 'auch',
  ]),
};

const HIGH_CONFIDENCE_THRESHOLD = 0.15;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.05;

function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[\p{L}]+/gu);
  return matches ?? [];
}

export function detectLanguage(text: string): LanguageResult {
  const tokens = tokenize(text);
  const scores = { en: 0, pt: 0, es: 0, fr: 0, de: 0 } as Record<Exclude<LanguageCode, 'und'>, number>;

  if (tokens.length === 0) {
    return { language: 'und', confidence: 'low', scores };
  }

  for (const token of tokens) {
    for (const lang of Object.keys(STOPWORDS) as Array<Exclude<LanguageCode, 'und'>>) {
      if (STOPWORDS[lang].has(token)) {
        scores[lang] += 1;
      }
    }
  }

  for (const lang of Object.keys(scores) as Array<Exclude<LanguageCode, 'und'>>) {
    scores[lang] = scores[lang] / tokens.length;
  }

  const ranked = (Object.entries(scores) as Array<[Exclude<LanguageCode, 'und'>, number]>).sort(
    (a, b) => b[1] - a[1],
  );
  const [topLang, topScore] = ranked[0]!;
  const secondScore = ranked[1]?.[1] ?? 0;

  if (topScore === 0) {
    return { language: 'und', confidence: 'low', scores };
  }

  const margin = topScore - secondScore;
  let confidence: Confidence = 'low';
  if (topScore >= HIGH_CONFIDENCE_THRESHOLD && margin >= 0.05) {
    confidence = 'high';
  } else if (topScore >= MEDIUM_CONFIDENCE_THRESHOLD) {
    confidence = 'medium';
  }

  return { language: topLang, confidence, scores };
}
