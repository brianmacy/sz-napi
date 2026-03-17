/**
 * Basic SDK Usage Example
 *
 * Demonstrates the core @senzing/sdk workflow:
 * - Creating an SzEnvironment
 * - Printing version/license info
 * - Adding records from multiple data sources
 * - Getting an entity by record
 * - Searching by attributes
 * - Cleaning up with destroy()
 *
 * Prerequisites:
 *   - Senzing runtime installed (brew install senzingsdk-runtime-unofficial on macOS)
 */

import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import {
  SzEnvironment,
  SzFlags,
  SzError,
  SzBadInputError,
  SzNotFoundError,
} from "@senzing/sdk";
import { addDataSource } from "@senzing/configtool";

// -- Platform detection -------------------------------------------------------
const isMac = process.platform === "darwin";
const senzingBase = isMac
  ? "/opt/homebrew/opt/senzing/runtime/er"
  : "/opt/senzing/er";
const supportPath = isMac
  ? "/opt/homebrew/opt/senzing/runtime/data"
  : "/opt/senzing/data";

// -- Configuration ------------------------------------------------------------
const dbPath = "/tmp/senzing-example.db";
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

// -- Initialize SQLite database with schema -----------------------------------
if (existsSync(dbPath)) unlinkSync(dbPath);
execSync(`sqlite3 ${dbPath} < ${schemaPath}`);

// -- Initialize the environment -----------------------------------------------
const env = new SzEnvironment("basic-example", settings, false);

try {
  // -- Bootstrap data sources -------------------------------------------------
  const configManager = env.getConfigManager();
  let configJson = configManager.createConfig();
  configJson = addDataSource(configJson, { code: "CUSTOMERS" });
  configJson = addDataSource(configJson, { code: "WATCHLIST" });
  const configId = configManager.setDefaultConfig(
    configJson,
    "Basic example config with CUSTOMERS and WATCHLIST"
  );
  env.reinitialize(configId);

  // -- Product info -----------------------------------------------------------
  const product = env.getProduct();
  const version = JSON.parse(product.getVersion());
  console.log(`Senzing version: ${version.VERSION}`);
  console.log(`Build date:      ${version.BUILD_DATE}`);

  const license = JSON.parse(product.getLicense());
  console.log(`License type:    ${license.licenseType}`);

  // -- Get the engine ---------------------------------------------------------
  const engine = env.getEngine();

  // -- Add records ------------------------------------------------------------
  // Records from two different data sources. The engine performs entity
  // resolution across all records regardless of source.

  const record1 = JSON.stringify({
    NAME_FULL: "Robert Smith",
    DATE_OF_BIRTH: "1985-02-15",
    ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
    SSN_NUMBER: "111-22-3333",
  });

  const record2 = JSON.stringify({
    NAME_FULL: "Bob J Smith",
    DATE_OF_BIRTH: "2/15/1985",
    ADDR_FULL: "123 Main Street, Las Vegas, NV 89101",
    PHONE_NUMBER: "702-555-1212",
  });

  const record3 = JSON.stringify({
    NAME_FULL: "Jane Doe",
    DATE_OF_BIRTH: "1990-07-20",
    ADDR_FULL: "456 Oak Ave, Henderson, NV 89002",
    EMAIL_ADDRESS: "jane.doe@example.com",
  });

  console.log("\nAdding records...");

  // addRecord returns WITH_INFO JSON when the WITH_INFO flag is set,
  // otherwise returns an empty string.
  const info1 = engine.addRecord("CUSTOMERS", "1001", record1, SzFlags.WITH_INFO);
  console.log(`Record 1001 info: ${info1}`);

  engine.addRecord("WATCHLIST", "W100", record2, SzFlags.NO_FLAGS);
  console.log("Record W100 added.");

  engine.addRecord("CUSTOMERS", "1002", record3, SzFlags.NO_FLAGS);
  console.log("Record 1002 added.");

  // -- Get entity by record ---------------------------------------------------
  // Retrieve the resolved entity that contains record 1001.
  console.log("\nGetting entity for record CUSTOMERS/1001...");
  const entityJson = engine.getEntityByRecord(
    "CUSTOMERS",
    "1001",
    SzFlags.ENTITY_DEFAULT_FLAGS
  );
  const entity = JSON.parse(entityJson);
  console.log(`Entity ID: ${entity.RESOLVED_ENTITY.ENTITY_ID}`);
  console.log(
    `Records in entity: ${entity.RESOLVED_ENTITY.RECORDS?.length ?? 0}`
  );

  // -- Search by attributes ---------------------------------------------------
  // Search for entities matching a set of attributes.
  const searchAttrs = JSON.stringify({
    NAME_FULL: "Robert Smith",
    ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
  });

  console.log("\nSearching by attributes...");
  const searchResult = engine.searchByAttributes(
    searchAttrs,
    undefined,
    SzFlags.SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS
  );
  const results = JSON.parse(searchResult);
  console.log(
    `Search returned ${results.RESOLVED_ENTITIES?.length ?? 0} entities`
  );

  for (const match of results.RESOLVED_ENTITIES ?? []) {
    console.log(
      `  Entity ${match.ENTITY.RESOLVED_ENTITY.ENTITY_ID} - ` +
        `match key: ${match.MATCH_INFO.MATCH_KEY}`
    );
  }

  // -- Export entities ---------------------------------------------------------
  // Iterate over all resolved entities using the SzExportIterator.
  console.log("\nExporting entities...");
  let entityCount = 0;
  for (const entity of engine.exportJsonEntityReport(
    SzFlags.EXPORT_DEFAULT_FLAGS
  )) {
    entityCount++;
  }
  console.log(`Export complete: ${entityCount} entities`);

  // -- Error handling ---------------------------------------------------------
  // Demonstrate the error hierarchy with instanceof checks.
  console.log("\nDemonstrating error handling...");
  try {
    engine.getRecord("NONEXISTENT_DS", "9999");
  } catch (e) {
    if (e instanceof SzNotFoundError) {
      console.log(`Caught SzNotFoundError: ${e.message}`);
    } else if (e instanceof SzBadInputError) {
      console.log(`Caught SzBadInputError: ${e.message}`);
    } else if (e instanceof SzError) {
      console.log(`Caught SzError (category=${e.category}): ${e.message}`);
    } else {
      throw e;
    }
  }

  // -- Engine stats -----------------------------------------------------------
  console.log("\nEngine statistics:");
  const stats = JSON.parse(engine.getStats());
  console.log(JSON.stringify(stats, null, 2));

  // -- Cleanup records (optional) ---------------------------------------------
  engine.deleteRecord("CUSTOMERS", "1001");
  engine.deleteRecord("WATCHLIST", "W100");
  engine.deleteRecord("CUSTOMERS", "1002");
  console.log("\nRecords deleted.");
} finally {
  // Always destroy the environment to release native resources.
  env.destroy();
  console.log("Environment destroyed.");
  // Clean up the SQLite database file
  if (existsSync(dbPath)) unlinkSync(dbPath);
}
