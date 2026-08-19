const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  pt: 'Portuguese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  und: 'Undetermined',
};

export function languageDisplayName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return '< 1 min read';
  const minutes = Math.round(seconds / 60);
  return `${minutes} min read`;
}

export function fleschLabel(score: number | null): string {
  if (score === null) return 'not enough text';
  if (score >= 90) return 'very easy';
  if (score >= 70) return 'easy';
  if (score >= 50) return 'moderate';
  if (score >= 30) return 'difficult';
  return 'very difficult';
}

export function confidenceLabel(confidence: 'high' | 'medium' | 'low'): string {
  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
}
