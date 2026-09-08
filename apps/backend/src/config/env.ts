import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  API_MAIL_KEY: z.string().min(1).optional(),
  PROMAILER_API_URL: z.string().url().default('https://api.promailer.xyz/api/v1'),
  MAIL_FROM: z.string().min(1).default('Riverside Community Hub <no-reply@example.com>'),
}).superRefine((values, context) => {
  const origins = values.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (origins.length === 0 || origins.some((origin) => !z.string().url().safeParse(origin).success)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['CORS_ORIGIN'], message: 'Use one or more comma-separated valid URLs.' });
  }
  if (values.NODE_ENV === 'production' && !values.API_MAIL_KEY) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['API_MAIL_KEY'], message: 'API_MAIL_KEY is required in production.' });
  }
});

export const env = envSchema.parse(process.env);
export const corsOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
