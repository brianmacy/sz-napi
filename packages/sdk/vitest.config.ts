import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      DYLD_LIBRARY_PATH: '/opt/homebrew/opt/senzing/runtime/er/lib',
    },
  },
});
