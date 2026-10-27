import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const apiRewrite = (path) => {
  if (path === '/api/bookings') return '/functions/v1/bookings-create';
  if (path === '/api/bookings/my') return '/functions/v1/bookings-my';
  if (path === '/api/bookings/cancel') return '/functions/v1/bookings-cancel';
  if (path === '/api/bookings/merge') return '/functions/v1/bookings-merge';
  return path;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  return {
    plugins: [react()],
    server: { proxy: supabaseUrl ? { '/api': { target: supabaseUrl, changeOrigin: true, secure: true, rewrite: apiRewrite } } : undefined },
    build: { rollupOptions: { output: { manualChunks(id) { if (id.includes('@supabase/')) return 'supabase'; } } } },
  };
});
