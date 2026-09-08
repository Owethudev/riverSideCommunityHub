import { env } from './env.js';

export const supabaseConfig = {
  url: env.SUPABASE_URL || null,
  anonKey: env.SUPABASE_ANON_KEY || null,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || null,
};

// Supabase client initialization will be added when persistence is introduced.
