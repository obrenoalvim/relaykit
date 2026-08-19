export interface StatsResult {
  characters: number;
  words: number;
  sentences: number;
  syllables: number;
  readingTimeSeconds: number;
  fleschReadingEase: number | null;
}

export interface LanguageResult {
  language: 'en' | 'pt' | 'es' | 'fr' | 'de' | 'und';
  confidence: 'high' | 'medium' | 'low';
  scores: Record<string, number>;
}

export interface Keyword {
  term: string;
  count: number;
}

export interface KeywordsResult {
  keywords: Keyword[];
}

export type Outcome<T> =
  | { status: 'ok'; data: T }
  | { status: 'unavailable'; reason: string };

export interface AnalyzeResponse {
  status: 'complete' | 'degraded';
  results: {
    stats: Outcome<StatsResult>;
    language: Outcome<LanguageResult>;
    keywords: Outcome<KeywordsResult>;
  };
}

export interface SpecialistHealth {
  name: string;
  status: 'up' | 'down';
  circuit: 'closed' | 'open' | 'half-open';
}

export interface HealthResponse {
  gateway: 'ok';
  specialists: Record<string, SpecialistHealth>;
}
