import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('lang-service HTTP API', () => {
  it('GET /health reports ok', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ service: 'lang-service', status: 'ok' });
  });

  it('POST /analyze detects language for valid text', async () => {
    const res = await request(createApp())
      .post('/analyze')
      .send({ text: 'The quick brown fox jumps over the lazy dog and it is fast.' });
    expect(res.status).toBe(200);
    expect(res.body.language).toBe('en');
  });

  it('POST /analyze rejects missing text', async () => {
    const res = await request(createApp()).post('/analyze').send({});
    expect(res.status).toBe(400);
  });
});
