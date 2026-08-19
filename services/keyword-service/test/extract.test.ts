import { describe, expect, it } from 'vitest';
import { extractKeywords } from '../src/extract.js';

describe('extractKeywords', () => {
  it('ranks repeated meaningful terms first', () => {
    const result = extractKeywords('cats cats dogs cats dogs birds');
    expect(result[0]).toEqual({ term: 'cats', count: 3 });
    expect(result[1]).toEqual({ term: 'dogs', count: 2 });
  });

  it('excludes stopwords', () => {
    const result = extractKeywords('the cat is on the mat and the dog is too');
    const terms = result.map((k) => k.term);
    expect(terms).not.toContain('the');
    expect(terms).not.toContain('is');
    expect(terms).not.toContain('and');
  });

  it('excludes short terms below the minimum length', () => {
    const result = extractKeywords('go go go elephant elephant');
    const terms = result.map((k) => k.term);
    expect(terms).not.toContain('go');
    expect(terms).toContain('elephant');
  });

  it('breaks ties alphabetically for stable ordering', () => {
    const result = extractKeywords('zebra zebra apple apple');
    expect(result.map((k) => k.term)).toEqual(['apple', 'zebra']);
  });

  it('respects a custom limit', () => {
    const result = extractKeywords('alpha beta gamma delta epsilon', 2);
    expect(result).toHaveLength(2);
  });

  it('returns an empty array for empty text', () => {
    expect(extractKeywords('')).toEqual([]);
  });
});
