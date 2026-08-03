import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/vitest/**/*.test.ts'],
    exclude: ['test/coverage-gaps*.test.mjs', 'node_modules', 'dist'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});