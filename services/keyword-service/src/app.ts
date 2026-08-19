import express, { type Request, type Response } from 'express';
import { extractKeywords } from './extract.js';

export const SERVICE_NAME = 'keyword-service';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ service: SERVICE_NAME, status: 'ok' });
  });

  app.post('/analyze', (req: Request, res: Response) => {
    const { text, limit } = req.body ?? {};
    if (typeof text !== 'string') {
      res.status(400).json({ error: 'text field must be a string' });
      return;
    }
    if (limit !== undefined && (typeof limit !== 'number' || limit <= 0)) {
      res.status(400).json({ error: 'limit must be a positive number' });
      return;
    }
    res.json({ keywords: extractKeywords(text, limit) });
  });

  return app;
}
