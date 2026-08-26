import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// The API lives on another origin, so in dev everything under /api is proxied.
// Production builds talk to VITE_API_BASE directly and rely on the API's CORS allowlist.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/api': {
        target: 'https://pinlon-lpms.bimats.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
