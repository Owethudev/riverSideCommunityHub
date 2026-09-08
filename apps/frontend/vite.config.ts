import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const values = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    envPrefix: ['API_'],
    define: {
      'import.meta.env.SUPABASE_URL': JSON.stringify(values.SUPABASE_URL),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(values.SUPABASE_ANON_KEY),
    },
    server: { port: 5173 },
  };
});
