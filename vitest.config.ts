import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@gallery/shared': resolve(__dirname, 'packages/shared/src'),
      '@gallery/db': resolve(__dirname, 'packages/db/src'),
      '@gallery/ai': resolve(__dirname, 'packages/ai/src'),
      '@gallery/sync': resolve(__dirname, 'packages/sync/src'),
      '@gallery/image-processor': resolve(__dirname, 'packages/image-processor/src'),
      '@gallery/ui': resolve(__dirname, 'packages/ui/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['packages/*/src/**/*.test.ts', 'packages/*/src/**/*.spec.ts'],
  },
});
