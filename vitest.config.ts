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
    include: [
      'packages/db/src/**/*.test.ts',
      'packages/ai/src/**/*.test.ts',
      'packages/sync/src/**/*.test.ts',
      'packages/image-processor/src/**/*.test.ts',
      'packages/shared/src/**/*.test.ts',
    ],
  },
});
