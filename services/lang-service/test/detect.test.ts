import { describe, expect, it } from 'vitest';
import { detectLanguage } from '../src/detect.js';

describe('detectLanguage', () => {
  it('detects English from common stopwords', () => {
    const result = detectLanguage('The cat is on the table and it is happy for that.');
    expect(result.language).toBe('en');
    expect(result.confidence).not.toBe('low');
  });

  it('detects Portuguese from common stopwords', () => {
    const result = detectLanguage('O gato está em cima da mesa e não quer descer para comer.');
    expect(result.language).toBe('pt');
  });

  it('detects Spanish from common stopwords', () => {
    const result = detectLanguage('El gato está en la mesa y no quiere bajar para comer con nosotros.');
    expect(result.language).toBe('es');
  });

  it('detects French from common stopwords', () => {
    const result = detectLanguage('Le chat est sur la table et il ne veut pas descendre pour manger.');
    expect(result.language).toBe('fr');
  });

  it('detects German from common stopwords', () => {
    const result = detectLanguage('Die Katze ist auf dem Tisch und sie will nicht für das Essen runter.');
    expect(result.language).toBe('de');
  });

  it('returns und for empty text', () => {
    const result = detectLanguage('');
    expect(result.language).toBe('und');
    expect(result.confidence).toBe('low');
  });

  it('returns und when no stopwords match', () => {
    const result = detectLanguage('xyzzy plugh qwerty foobar');
    expect(result.language).toBe('und');
  });

  it('always includes a score for every supported language', () => {
    const result = detectLanguage('the of and');
    expect(Object.keys(result.scores).sort()).toEqual(['de', 'en', 'es', 'fr', 'pt']);
  });
});
