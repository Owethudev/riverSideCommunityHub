import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  API_MAIL_KEY: z.string().min(1).optional(),
  PROMAILER_API_URL: z.string().url().default('https://api.promailer.xyz/api/v1'),
  MAIL_FROM: z.string().min(1).default('Riverside Community Hub <no-reply@example.com>'),
});

export const env = envSchema.parse(process.env);
