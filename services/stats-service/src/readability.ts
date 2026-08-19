export interface TextStats {
  characters: number;
  words: number;
  sentences: number;
  syllables: number;
  readingTimeSeconds: number;
  fleschReadingEase: number | null;
}

const WORDS_PER_MINUTE = 200;

export function countWords(text: string): number {
  const matches = text.trim().match(/[\p{L}\p{N}'-]+/gu);
  return matches ? matches.length : 0;
}

export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  const matches = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return matches ? matches.filter((s) => s.trim().length > 0).length : 0;
}

export function countSyllables(word: string): number {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized.length === 0) return 0;
  if (normalized.length <= 3) return 1;

  const withoutTrailingE = normalized.replace(/e$/, '');
  const groups = withoutTrailingE.match(/[aeiouy]+/g);
  const count = groups ? groups.length : 1;
  return Math.max(1, count);
}

export function countTotalSyllables(text: string): number {
  const matches = text.match(/[\p{L}'-]+/gu);
  if (!matches) return 0;
  return matches.reduce((sum, word) => sum + countSyllables(word), 0);
}

export function fleschReadingEase(words: number, sentences: number, syllables: number): number | null {
  if (words === 0 || sentences === 0) return null;
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.round(score * 100) / 100;
}

export function estimateReadingTimeSeconds(words: number): number {
  return Math.round((words / WORDS_PER_MINUTE) * 60);
}

export function analyzeText(text: string): TextStats {
  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = countTotalSyllables(text);

  return {
    characters: text.length,
    words,
    sentences,
    syllables,
    readingTimeSeconds: estimateReadingTimeSeconds(words),
    fleschReadingEase: fleschReadingEase(words, sentences, syllables),
  };
}
