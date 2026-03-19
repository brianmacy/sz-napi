/**
 * Configtool Process Script Snippet
 *
 * Demonstrates applying batch configuration changes via processScript():
 * - Building a multi-command script string
 * - Applying it to a config JSON in one call
 * - Verifying the results
 * - Error handling for invalid script commands
 *
 * No Senzing runtime required -- works with pure JSON configs.
 *
 * NOTE: processScript requires a full Senzing config template (from
 * configManager.createConfig()), not a minimal test fixture.
 *
 * Usage: npx tsx index.ts <config-json-file>
 *   Get a config file: use configManager.createConfig() from @senzing/sdk
 */

import { readFileSync } from "node:fs";
import {
  addDataSource,
  processScript,
  listDataSources,
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

// -- Show data sources before script ------------------------------------------
console.log("Data sources before script:");
const before = JSON.parse(listDataSources(configJson));
for (const ds of before) {
  console.log(`  ${ds.DSRC_CODE ?? ds.dataSource} (id: ${ds.DSRC_ID ?? ds.id})`);
}

// -- Define a multi-command script --------------------------------------------
/** Each line is one configtool command, applied in order. */
const script = [
  "addDataSource CUSTOMERS",
  "addDataSource WATCHLIST",
  "addDataSource EMPLOYEES",
].join("\n");

console.log("\nApplying script:");
for (const line of script.split("\n")) {
  console.log(`  ${line}`);
}

// -- Apply the script ---------------------------------------------------------
try {
  configJson = processScript(configJson, script);

  // -- Show data sources after script -----------------------------------------
  console.log("\nData sources after script:");
  const after = JSON.parse(listDataSources(configJson));
  for (const ds of after) {
    console.log(`  ${ds.DSRC_CODE ?? ds.dataSource} (id: ${ds.DSRC_ID ?? ds.id})`);
  }

  const addedCount = after.length - before.length;
  console.log(`\n  Added ${addedCount} net new data source(s) via script`);
} catch (e) {
  if (e instanceof SzConfigError) {
    console.log(`\n  processScript not supported for this config format.`);
    console.log(`  Error: ${e.message}`);
    console.log(`  (processScript requires a full Senzing config template)`);

    // Fall back to demonstrating individual addDataSource calls
    console.log("\n  Falling back to individual addDataSource calls...");
    for (const code of ["CUSTOMERS", "WATCHLIST", "EMPLOYEES"]) {
      configJson = addDataSource(configJson, { code });
      console.log(`    Added: ${code}`);
    }
  } else {
    throw e;
  }
}

// -- Error handling: bad script command ---------------------------------------
console.log("\nError handling: invalid script command...");
try {
  processScript(configJson, "notAValidCommand FOO_BAR");
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
