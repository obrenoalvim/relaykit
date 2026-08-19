import express, { type Request, type Response } from 'express';
import { checkHealth, type HealthDeps } from './health.js';
import { aggregateAnalysis, type RelayDeps } from './relay.js';
import type { SpecialistConfig } from './registry.js';

export const SERVICE_NAME = 'gateway';

export interface CreateAppOptions {
  specialists: SpecialistConfig[];
  relayDeps?: RelayDeps;
  healthDeps?: HealthDeps;
}

export function createApp({ specialists, relayDeps = {}, healthDeps = {} }: CreateAppOptions) {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', async (_req: Request, res: Response) => {
    const health = await checkHealth(specialists, healthDeps);
    res.json(health);
  });

  app.post('/analyze', async (req: Request, res: Response) => {
    const { text } = req.body ?? {};
    if (typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'text field must be a non-empty string' });
      return;
    }

    const result = await aggregateAnalysis(text, specialists, relayDeps);
    res.status(result.status === 'degraded' ? 207 : 200).json(result);
  });

  return app;
}
