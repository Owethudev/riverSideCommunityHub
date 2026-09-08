import { env } from './env';

export const supabaseConfig = {
  url: env.VITE_SUPABASE_URL || null,
  anonKey: env.VITE_SUPABASE_ANON_KEY || null,
};

// Supabase client initialization will be added when persistence is introduced.
