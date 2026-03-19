/**
 * Configtool Basic Usage Snippet
 *
 * Demonstrates core configtool operations on a Senzing config JSON file:
 * - Listing, adding, getting, and deleting data sources
 * - Listing features
 * - Error handling with SzConfigError
 *
 * No Senzing runtime required -- works with pure JSON configs.
 *
 * Usage: npx tsx index.ts <config-json-file>
 *   Get a config file: use configManager.createConfig() from @senzing/sdk
 */

import { readFileSync } from "node:fs";
import {
  addDataSource,
  deleteDataSource,
  getDataSource,
  listDataSources,
  listFeatures,
  getVersion,
  getCompatibilityVersion,
  SzConfigError,
} from "@senzing/configtool";

const configPath = process.argv[2];
if (!configPath) {
  console.error("Usage: npx tsx index.ts <config-json-file>");
  console.error("  Get a config file: use configManager.createConfig() from @senzing/sdk");
  process.exit(1);
}

/** Load the config JSON from the file path provided on the command line. */
let configJson = readFileSync(configPath, "utf-8");

// -- Version info -------------------------------------------------------------
console.log("Config Version Information");
console.log("--------------------------");
try {
  console.log(`  Version:               ${getVersion(configJson)}`);
  console.log(`  Compatibility version: ${getCompatibilityVersion(configJson)}`);
} catch (e) {
  if (e instanceof SzConfigError) {
    console.log("  Version info not available in this config (skipping).");
  } else {
    throw e;
  }
}

// -- List existing data sources -----------------------------------------------
console.log("\nExisting data sources:");
const existingSources = JSON.parse(listDataSources(configJson));
for (const ds of existingSources) {
  console.log(`  ${ds.DSRC_CODE ?? ds.dataSource} (id: ${ds.DSRC_ID ?? ds.id})`);
}

// -- Add three new data sources -----------------------------------------------
console.log("\nAdding data sources...");
const newSources = ["CRM_SYSTEM", "PUBLIC_RECORDS", "PARTNER_FEED"];
for (const code of newSources) {
  configJson = addDataSource(configJson, { code });
  console.log(`  Added: ${code}`);
}

// -- Get a specific data source by code ---------------------------------------
console.log("\nGet data source CRM_SYSTEM:");
const crmSource = JSON.parse(getDataSource(configJson, "CRM_SYSTEM"));
console.log(`  ${JSON.stringify(crmSource, null, 2)}`);

// -- List data sources after additions ----------------------------------------
console.log("\nData sources after additions:");
const afterAdd = JSON.parse(listDataSources(configJson));
for (const ds of afterAdd) {
  console.log(`  ${ds.DSRC_CODE ?? ds.dataSource} (id: ${ds.DSRC_ID ?? ds.id})`);
}

// -- Delete one data source ---------------------------------------------------
console.log("\nDeleting PARTNER_FEED...");
configJson = deleteDataSource(configJson, "PARTNER_FEED");
const afterDelete = JSON.parse(listDataSources(configJson));
console.log("Data sources after deletion:");
for (const ds of afterDelete) {
  console.log(`  ${ds.DSRC_CODE ?? ds.dataSource} (id: ${ds.DSRC_ID ?? ds.id})`);
}

// -- List features (first 5) -------------------------------------------------
console.log("\nFeatures (first 5):");
const features: Record<string, string>[] = JSON.parse(listFeatures(configJson));
for (const feat of features.slice(0, 5)) {
  console.log(`  ${feat.FTYPE_CODE ?? feat.feature} (class: ${feat.FCLASS_CODE ?? feat.class})`);
}
console.log(`  ... (${features.length} total features)`);

// -- Error handling: try to add a duplicate data source -----------------------
console.log("\nError handling: adding duplicate data source...");
try {
  addDataSource(configJson, { code: "CRM_SYSTEM" });
  console.log("  ERROR: Expected SzConfigError but none was thrown");
} catch (e) {
  if (e instanceof SzConfigError) {
    console.log(`  Caught SzConfigError:`);
    console.log(`    errorType: ${e.errorType}`);
    console.log(`    message:   ${e.message}`);
  } else {
    throw e;
  }
}

console.log("\nDone.");
