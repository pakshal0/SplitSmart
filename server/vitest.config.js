import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false, // Run test files sequentially to prevent database collision
    testTimeout: 10000,
  },
});
