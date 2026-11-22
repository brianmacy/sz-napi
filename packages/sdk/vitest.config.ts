import { defineConfig } from 'vitest/config';

// SENZING_DIR (the `er` directory, as for the sz-rust-sdk build) overrides the Homebrew default.
const senzingLib = `${process.env.SENZING_DIR || '/opt/homebrew/opt/senzing/er'}/lib`;

export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      DYLD_LIBRARY_PATH: `${senzingLib}:/opt/homebrew/opt/sqlite/lib:/opt/homebrew/opt/openssl@3/lib`,
    },
  },
});
