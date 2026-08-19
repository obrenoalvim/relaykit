import { describe, expect, it } from 'vitest';
import {
  analyzeText,
  countSentences,
  countSyllables,
  countTotalSyllables,
  countWords,
  estimateReadingTimeSeconds,
  fleschReadingEase,
} from '../src/readability.js';

describe('countWords', () => {
  it('counts simple words', () => {
    expect(countWords('The quick brown fox')).toBe(4);
  });

  it('ignores punctuation-only tokens', () => {
    expect(countWords('Hello, world!!!')).toBe(2);
  });

  it('returns 0 for empty text', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });

  it('counts hyphenated and apostrophe words as one', () => {
    expect(countWords("state-of-the-art don't")).toBe(2);
  });
});

describe('countSentences', () => {
  it('counts sentences split by terminal punctuation', () => {
    expect(countSentences('One. Two! Three?')).toBe(3);
  });

  it('counts a trailing sentence without punctuation', () => {
    expect(countSentences('One. Two')).toBe(2);
  });

  it('returns 0 for empty text', () => {
    expect(countSentences('')).toBe(0);
  });
});

describe('countSyllables', () => {
  it('counts one syllable for short words', () => {
    expect(countSyllables('a')).toBe(1);
    expect(countSyllables('the')).toBe(1);
  });

  it('counts multiple vowel groups', () => {
    expect(countSyllables('beautiful')).toBeGreaterThanOrEqual(3);
  });

  it('never returns 0 for a non-empty word', () => {
    expect(countSyllables('rhythm')).toBeGreaterThanOrEqual(1);
  });

  it('returns 0 for empty input', () => {
    expect(countSyllables('')).toBe(0);
  });
});

describe('countTotalSyllables', () => {
  it('sums syllables across words', () => {
    expect(countTotalSyllables('cat dog')).toBe(2);
  });

  it('returns 0 when there are no words', () => {
    expect(countTotalSyllables('...')).toBe(0);
  });
});

describe('fleschReadingEase', () => {
  it('returns null when words or sentences are zero', () => {
    expect(fleschReadingEase(0, 1, 1)).toBeNull();
    expect(fleschReadingEase(1, 0, 1)).toBeNull();
  });

  it('scores easy short sentences higher than dense long ones', () => {
    const easy = fleschReadingEase(4, 2, 4);
    const hard = fleschReadingEase(40, 1, 90);
    expect(easy).not.toBeNull();
    expect(hard).not.toBeNull();
    expect(easy as number).toBeGreaterThan(hard as number);
  });
});

describe('estimateReadingTimeSeconds', () => {
  it('estimates at 200 words per minute', () => {
    expect(estimateReadingTimeSeconds(200)).toBe(60);
    expect(estimateReadingTimeSeconds(0)).toBe(0);
  });
});

describe('analyzeText', () => {
  it('produces a full stats object for real text', () => {
    const result = analyzeText('The quick brown fox jumps over the lazy dog.');
    expect(result.words).toBe(9);
    expect(result.sentences).toBe(1);
    expect(result.characters).toBe(44);
    expect(result.syllables).toBeGreaterThan(0);
    expect(result.fleschReadingEase).not.toBeNull();
  });

  it('handles empty text without throwing', () => {
    const result = analyzeText('');
    expect(result.words).toBe(0);
    expect(result.fleschReadingEase).toBeNull();
  });
});
