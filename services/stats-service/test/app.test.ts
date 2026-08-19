import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('stats-service HTTP API', () => {
  it('GET /health reports ok', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ service: 'stats-service', status: 'ok' });
  });

  it('POST /analyze returns stats for valid text', async () => {
    const res = await request(createApp())
      .post('/analyze')
      .send({ text: 'Short sentence here.' });
    expect(res.status).toBe(200);
    expect(res.body.words).toBe(3);
    expect(res.body.sentences).toBe(1);
  });

  it('POST /analyze rejects missing text', async () => {
    const res = await request(createApp()).post('/analyze').send({});
    expect(res.status).toBe(400);
  });

  it('POST /analyze rejects non-string text', async () => {
    const res = await request(createApp())
      .post('/analyze')
      .send({ text: 42 });
    expect(res.status).toBe(400);
  });
});
