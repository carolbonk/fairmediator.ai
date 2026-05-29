import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Keep this separate from vite.config.js so the prod build never pulls in
// jsdom or testing-library. Run with `npm test`.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
});
