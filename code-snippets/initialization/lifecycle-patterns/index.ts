/**
 * Lifecycle Patterns Snippet
 *
 * Demonstrates proper SzEnvironment lifecycle management:
 * - Full manual setup (no shared utility)
 * - try/finally cleanup pattern
 * - env.isDestroyed() guard checks
 * - Catching SzEnvironmentDestroyedError when using a destroyed env
 *
 * Run: npx tsx index.ts
 */

import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { SzEnvironment, SzEnvironmentDestroyedError } from "@senzing/sdk";
import { addDataSource } from "@senzing/configtool";

// -- Platform detection -------------------------------------------------------
const isMac = process.platform === "darwin";
const senzingBase = isMac ? "/opt/homebrew/opt/senzing/runtime/er" : "/opt/senzing/er";
const supportPath = isMac ? "/opt/homebrew/opt/senzing/runtime/data" : "/opt/senzing/data";

// -- Database setup -----------------------------------------------------------
const dbPath = `/tmp/senzing-snippet-lifecycle-${process.pid}.db`;
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

if (existsSync(dbPath)) unlinkSync(dbPath);
execSync(`sqlite3 ${dbPath} < ${schemaPath}`);

// -- Create the environment ---------------------------------------------------
const env = new SzEnvironment("lifecycle-demo", settings, false);
console.log(`Environment created. isDestroyed = ${env.isDestroyed()}`);

try {
  // -- Bootstrap a default config (required for engine/diagnostic access) -----
  const configManager = env.getConfigManager();
  const configJson = configManager.createConfig();
  const configId = configManager.setDefaultConfig(configJson, "lifecycle demo");
  env.reinitialize(configId);

  // -- Normal operations ------------------------------------------------------
  const product = env.getProduct();
  const version = JSON.parse(product.getVersion());
  console.log(`Senzing version: ${version.VERSION}`);

  const activeConfigId = env.getActiveConfigId();
  console.log(`Active config ID: ${activeConfigId}`);

  console.log(`\nBefore destroy: isDestroyed = ${env.isDestroyed()}`);

  // -- Destroy the environment ------------------------------------------------
  env.destroy();
  console.log(`After destroy:  isDestroyed = ${env.isDestroyed()}`);

  // -- Demonstrate SzEnvironmentDestroyedError --------------------------------
  console.log("\nAttempting to use destroyed environment...");
  try {
    env.getEngine();
  } catch (e) {
    if (e instanceof SzEnvironmentDestroyedError) {
      console.log(`Caught SzEnvironmentDestroyedError: ${e.message}`);
    } else {
      throw e;
    }
  }
} finally {
  // -- Safe cleanup: guard with isDestroyed() ---------------------------------
  if (!env.isDestroyed()) {
    env.destroy();
    console.log("Environment destroyed in finally block.");
  } else {
    console.log("Environment already destroyed; skipping in finally block.");
  }

  // -- Clean up the SQLite database file --------------------------------------
  if (existsSync(dbPath)) unlinkSync(dbPath);
  console.log("Database file cleaned up.");
}
