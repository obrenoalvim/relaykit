import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('keyword-service HTTP API', () => {
  it('GET /health reports ok', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ service: 'keyword-service', status: 'ok' });
  });

  it('POST /analyze returns ranked keywords', async () => {
    const res = await request(createApp())
      .post('/analyze')
      .send({ text: 'microservices microservices gateway relay' });
    expect(res.status).toBe(200);
    expect(res.body.keywords[0].term).toBe('microservices');
  });

  it('POST /analyze respects a custom limit', async () => {
    const res = await request(createApp())
      .post('/analyze')
      .send({ text: 'alpha beta gamma delta', limit: 1 });
    expect(res.status).toBe(200);
    expect(res.body.keywords).toHaveLength(1);
  });

  it('POST /analyze rejects missing text', async () => {
    const res = await request(createApp()).post('/analyze').send({});
    expect(res.status).toBe(400);
  });

  it('POST /analyze rejects invalid limit', async () => {
    const res = await request(createApp())
      .post('/analyze')
      .send({ text: 'hello world', limit: -1 });
    expect(res.status).toBe(400);
  });
});
