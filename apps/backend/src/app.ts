import cors from 'cors';
import express from 'express';
import { healthResponseSchema } from '@riverside/shared';
import { env } from './config/env.js';

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (_request, response) => {
  const payload = healthResponseSchema.parse({
    status: 'ok',
    service: 'riverside-community-hub-api',
    timestamp: new Date().toISOString(),
  });

  response.json(payload);
});

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' });
});
