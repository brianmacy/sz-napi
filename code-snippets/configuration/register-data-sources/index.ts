/**
 * Register Data Sources
 *
 * Demonstrates the full multi-step configuration flow:
 * createConfig() → addDataSource() → registerConfig() → setDefaultConfigId()
 * → reinitialize(). Then adds a record to verify the engine is operational.
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
import { addDataSource, listDataSources } from "@senzing/configtool";

// -- Platform detection -------------------------------------------------------
const isMac = process.platform === "darwin";
const senzingBase = isMac
  ? "/opt/homebrew/opt/senzing/runtime/er"
  : "/opt/senzing/er";
const supportPath = isMac
  ? "/opt/homebrew/opt/senzing/runtime/data"
  : "/opt/senzing/data";

// -- Database setup -----------------------------------------------------------
const dbPath = `/tmp/senzing-snippet-register-data-sources-${process.pid}.db`;
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

const env = new SzEnvironment("RegisterDataSources", settings);
try {
  const configManager = env.getConfigManager();

  // -- Build a config with custom data sources --------------------------------

  /** Start from a baseline config. */
  let configJson = configManager.createConfig();

  /** Add multiple data sources to the config definition. */
  const sourceCodes = ["CUSTOMERS", "WATCHLIST", "REFERENCE"];
  for (const code of sourceCodes) {
    configJson = addDataSource(configJson, { code });
  }

  /** Confirm the data sources were added. */
  const sources = JSON.parse(listDataSources(configJson));
  console.log(
    "Data sources in config:",
    sources.map((s: Record<string, string>) => s.DSRC_CODE ?? s.dataSource).join(", "),
  );

  // -- Register and activate the config ---------------------------------------

  /** Register the config (does NOT make it the active default). */
  const configId = configManager.registerConfig(
    configJson,
    `Config with ${sourceCodes.join(", ")}`,
  );
  console.log(`Config registered — config ID: ${configId}`);

  /** Set the registered config as the active default. */
  configManager.setDefaultConfigId(configId);
  console.log("Config set as default.");

  /** Re-initialize so all engines pick up the new config. */
  env.reinitialize(configId);
  console.log("Environment re-initialized.");

  // -- Display the config registry --------------------------------------------
  const registry = JSON.parse(configManager.getConfigRegistry());
  console.log("\nConfig registry:");
  for (const entry of registry.CONFIGS ?? []) {
    console.log(`  ID: ${entry.CONFIG_ID}  Comment: ${entry.CONFIG_COMMENTS}`);
  }

  // -- Verify the engine works by adding a record -----------------------------
  const engine = env.getEngine();
  const record = JSON.stringify({
    NAME_FULL: "Jane Smith",
    ADDR_FULL: "123 Main St, Springfield, IL 62704",
  });
  engine.addRecord("CUSTOMERS", "TEST-1", record);
  console.log("\nRecord added successfully to CUSTOMERS as TEST-1.");
} finally {
  env.destroy();
  if (existsSync(dbPath)) unlinkSync(dbPath);
}
