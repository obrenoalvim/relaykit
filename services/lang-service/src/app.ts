import express, { type Request, type Response } from 'express';
import { detectLanguage } from './detect.js';

export const SERVICE_NAME = 'lang-service';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ service: SERVICE_NAME, status: 'ok' });
  });

  app.post('/analyze', (req: Request, res: Response) => {
    const { text } = req.body ?? {};
    if (typeof text !== 'string') {
      res.status(400).json({ error: 'text field must be a string' });
      return;
    }
    res.json(detectLanguage(text));
  });

  return app;
}
