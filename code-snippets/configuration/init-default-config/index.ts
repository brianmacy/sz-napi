/**
 * Init Default Config
 *
 * Demonstrates the simplest path to a working Senzing environment:
 * createConfig() → setDefaultConfig() → reinitialize().
 *
 * Prerequisites:
 *   - Senzing runtime installed (brew install senzingsdk-runtime-unofficial on macOS)
 *
 * Usage:
 *   npx tsx index.ts
 */

import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { SzEnvironment } from "@senzing/sdk";

// -- Platform detection -------------------------------------------------------
const isMac = process.platform === "darwin";
const senzingBase = isMac
  ? "/opt/homebrew/opt/senzing/runtime/er"
  : "/opt/senzing/er";
const supportPath = isMac
  ? "/opt/homebrew/opt/senzing/runtime/data"
  : "/opt/senzing/data";

// -- Database setup -----------------------------------------------------------
const dbPath = `/tmp/senzing-snippet-init-default-config-${process.pid}.db`;
const schemaPath = `${senzingBase}/resources/schema/szcore-schema-sqlite-create.sql`;

const settings = JSON.stringify({
  PIPELINE: {
    CONFIGPATH: `${senzingBase}/resources/templates`,
    RESOURCEPATH: `${senzingBase}/resources`,
    SUPPORTPATH: supportPath,
  },
  SQL: {
    CONNECTION: `sqlite3://na:na@${dbPath}`,
  },
});

// Create a fresh SQLite database from the Senzing schema
if (existsSync(dbPath)) unlinkSync(dbPath);
execSync(`sqlite3 ${dbPath} < ${schemaPath}`);

const env = new SzEnvironment("InitDefaultConfig", settings);
try {
  // -- Create and activate a default config -----------------------------------
  const configManager = env.getConfigManager();

  /** Create a baseline config from the Senzing templates. */
  const configJson = configManager.createConfig();

  /** Register the config and set it as the active default in one step. */
  const configId = configManager.setDefaultConfig(
    configJson,
    "Initial default configuration",
  );
  console.log(`Default config registered — config ID: ${configId}`);

  /** Re-initialize the environment so all engines pick up the new config. */
  env.reinitialize(configId);
  console.log("Environment re-initialized with new config.");

  // -- Verify the engine is working -------------------------------------------
  const product = env.getProduct();
  const version = JSON.parse(product.getVersion());
  console.log(`Senzing version: ${version.VERSION}`);
  console.log(`Build date:      ${version.BUILD_DATE}`);
} finally {
  env.destroy();
  if (existsSync(dbPath)) unlinkSync(dbPath);
}
