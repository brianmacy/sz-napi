/**
 * ConfigTool Standalone Example
 *
 * Demonstrates @senzing/configtool for offline configuration editing.
 * No Senzing runtime is needed -- configtool works with pure JSON.
 *
 * This is useful for:
 * - Building configs in CI/CD pipelines before deployment
 * - Creating config management UIs
 * - Preparing configs for testing without a running engine
 *
 * Prerequisites:
 *   - npm install @senzing/configtool
 *   - A Senzing config JSON file (or use createConfig from @senzing/sdk)
 */

import { readFileSync, writeFileSync } from "node:fs";
import {
  addDataSource,
  deleteDataSource,
  listDataSources,
  getDataSource,
  setDataSource,
  addAttribute,
  listAttributes,
  listFeatures,
  getVersion,
  getCompatibilityVersion,
  listConfigSections,
  processScript,
  SzConfigError,
} from "@senzing/configtool";

// -- Load a config JSON file ------------------------------------------------
// In a real workflow, this would come from:
//   - configManager.createConfig() from @senzing/sdk
//   - A file saved from a previous session
//   - A template shipped with your application
const configPath = process.argv[2];
if (!configPath) {
  console.error("Usage: tsx index.ts <config-json-file>");
  console.error("  Get a config file with: configManager.createConfig()");
  process.exit(1);
}

let configJson = readFileSync(configPath, "utf-8");
console.log(`Loaded config from: ${configPath}`);

// -- Version info -----------------------------------------------------------
try {
  const version = getVersion(configJson);
  console.log(`Config version: ${version}`);

  const compatVersion = getCompatibilityVersion(configJson);
  console.log(`Compatibility version: ${compatVersion}`);
} catch (e) {
  if (e instanceof SzConfigError) {
    console.log("Version info not available in this config (skipping).");
  } else {
    throw e;
  }
}

// -- List config sections ---------------------------------------------------
const sections = listConfigSections(configJson);
console.log(`\nConfig sections: ${sections}`);

// -- Data Sources -----------------------------------------------------------
console.log("\n--- Data Sources ---");

// List existing data sources
let sources = JSON.parse(listDataSources(configJson));
console.log(`Current data sources (${sources.length}):`);
for (const ds of sources) {
  console.log(`  ${ds.DSRC_CODE} (ID: ${ds.DSRC_ID})`);
}

// Add new data sources
console.log("\nAdding data sources...");
configJson = addDataSource(configJson, { code: "CRM_SYSTEM" });
configJson = addDataSource(configJson, { code: "PUBLIC_RECORDS" });
configJson = addDataSource(configJson, {
  code: "PARTNER_FEED",
  retentionLevel: "Remember",
  reliability: 7,
});

// Verify the additions
sources = JSON.parse(listDataSources(configJson));
console.log(`Data sources after additions (${sources.length}):`);
for (const ds of sources) {
  console.log(`  ${ds.DSRC_CODE} (ID: ${ds.DSRC_ID})`);
}

// Get a specific data source
const crmSource = getDataSource(configJson, "CRM_SYSTEM");
console.log(`\nCRM_SYSTEM details: ${crmSource}`);

// Modify a data source
configJson = setDataSource(configJson, "PARTNER_FEED", { reliability: 9 });
console.log("Updated PARTNER_FEED reliability to 9.");

// Delete a data source
configJson = deleteDataSource(configJson, "PUBLIC_RECORDS");
sources = JSON.parse(listDataSources(configJson));
console.log(
  `\nAfter deleting PUBLIC_RECORDS: ${sources.map((ds: { DSRC_CODE: string }) => ds.DSRC_CODE).join(", ")}`
);

// -- Attributes -------------------------------------------------------------
console.log("\n--- Attributes ---");

const attributes = JSON.parse(listAttributes(configJson));
console.log(`Total attributes: ${attributes.length}`);
console.log("First 5 attributes:");
for (const attr of attributes.slice(0, 5)) {
  console.log(`  ${attr.ATTR_CODE} -> feature: ${attr.FTYPE_CODE}, class: ${attr.ATTR_CLASS}`);
}

// Add a custom attribute
configJson = addAttribute(configJson, {
  attribute: "LOYALTY_NUMBER",
  feature: "OTHER_ID",
  element: "OTHER_ID_NUMBER",
  class: "OTHER",
});
console.log("\nAdded LOYALTY_NUMBER attribute.");

// -- Features ---------------------------------------------------------------
console.log("\n--- Features ---");

const features = JSON.parse(listFeatures(configJson));
console.log(`Total features: ${features.length}`);
console.log("First 5 features:");
for (const feat of features.slice(0, 5)) {
  console.log(`  ${feat.FTYPE_CODE} (class: ${feat.FCLASS_CODE}, behavior: ${feat.BEHAVIOR})`);
}

// -- Batch script processing ------------------------------------------------
console.log("\n--- Script Processing ---");

// processScript applies a series of GTC commands to the config.
// This is useful for applying standardized config changes.
const script = `
addDataSource BATCH_SOURCE_1
addDataSource BATCH_SOURCE_2
`;

try {
  configJson = processScript(configJson, script);
  sources = JSON.parse(listDataSources(configJson));
  console.log("After script processing:");
  console.log(
    `  Data sources: ${sources.map((ds: { DSRC_CODE: string }) => ds.DSRC_CODE).join(", ")}`
  );
} catch (e) {
  if (e instanceof SzConfigError) {
    console.error(`Script processing error (${e.errorType}): ${e.message}`);
  } else {
    throw e;
  }
}

// -- Error handling ---------------------------------------------------------
console.log("\n--- Error Handling ---");

try {
  // Attempting to add a duplicate data source
  configJson = addDataSource(configJson, { code: "CRM_SYSTEM" });
} catch (e) {
  if (e instanceof SzConfigError) {
    console.log(`Expected error caught: ${e.message}`);
  } else {
    throw e;
  }
}

try {
  // Attempting to get a nonexistent data source
  getDataSource(configJson, "DOES_NOT_EXIST");
} catch (e) {
  if (e instanceof SzConfigError) {
    console.log(`Expected error caught: ${e.message}`);
  } else {
    throw e;
  }
}

// -- Save the modified config -----------------------------------------------
const outputPath = configPath.replace(".json", "-modified.json");
writeFileSync(outputPath, configJson, "utf-8");
console.log(`\nSaved modified config to: ${outputPath}`);
