import { z } from 'zod';

const envSchema = z.object({
  API_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
});

const parsedEnv = envSchema.parse(import.meta.env);

export const env = {
  ...parsedEnv,
  VITE_API_URL: parsedEnv.API_URL,
  VITE_SUPABASE_URL: parsedEnv.SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: parsedEnv.SUPABASE_ANON_KEY,
};