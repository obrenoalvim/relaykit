import { describe, expect, it } from 'vitest';
import { confidenceLabel, fleschLabel, formatReadingTime, languageDisplayName } from './format';

describe('languageDisplayName', () => {
  it('maps known codes to display names', () => {
    expect(languageDisplayName('en')).toBe('English');
    expect(languageDisplayName('pt')).toBe('Portuguese');
    expect(languageDisplayName('und')).toBe('Undetermined');
  });

  it('falls back to the raw code for unknown values', () => {
    expect(languageDisplayName('xx')).toBe('xx');
  });
});

describe('formatReadingTime', () => {
  it('shows a short label under one minute', () => {
    expect(formatReadingTime(30)).toBe('< 1 min read');
  });

  it('rounds to the nearest minute otherwise', () => {
    expect(formatReadingTime(90)).toBe('2 min read');
    expect(formatReadingTime(120)).toBe('2 min read');
  });
});

describe('fleschLabel', () => {
  it('returns not enough text for null scores', () => {
    expect(fleschLabel(null)).toBe('not enough text');
  });

  it('buckets scores into readability tiers', () => {
    expect(fleschLabel(95)).toBe('very easy');
    expect(fleschLabel(75)).toBe('easy');
    expect(fleschLabel(55)).toBe('moderate');
    expect(fleschLabel(35)).toBe('difficult');
    expect(fleschLabel(10)).toBe('very difficult');
  });
});

describe('confidenceLabel', () => {
  it('capitalizes the confidence value', () => {
    expect(confidenceLabel('high')).toBe('High');
    expect(confidenceLabel('low')).toBe('Low');
  });
});
