/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { reviewApi } from './server/reviewApi';

export default defineConfig({
  plugins: [react(), tailwindcss(), reviewApi()],
  // saved reviews are written while the app runs; they are data, not source, so they never trigger a reload
  server: { watch: { ignored: ['**/src/data/cases/*/review.json*', '**/src/data/cases/*/extraction.json*'] } },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
