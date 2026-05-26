import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5174',
      '/ws': {
        target: 'ws://localhost:5174',
        ws: true,
      },
    },
  },
});
