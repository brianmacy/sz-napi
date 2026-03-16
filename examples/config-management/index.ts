/**
 * Config Management Example
 *
 * Demonstrates the Senzing configuration management workflow:
 * - Creating a config template from the engine
 * - Using @senzing/configtool to modify the config (add data sources)
 * - Registering and activating the modified config
 * - Reinitializing the environment with the new config
 *
 * This is the typical workflow for setting up a new Senzing repository
 * or modifying the configuration of an existing one.
 *
 * Prerequisites:
 *   - Senzing runtime installed
 *   - DYLD_LIBRARY_PATH or LD_LIBRARY_PATH set to the Senzing lib directory
 */

import { SzEnvironment, SzFlags } from "@senzing/sdk";
import { addDataSource, listDataSources } from "@senzing/configtool";

// -- Configuration ----------------------------------------------------------
const settings = JSON.stringify({
  PIPELINE: {
    CONFIGPATH: "/opt/senzing/er/resources/templates",
    RESOURCEPATH: "/opt/senzing/er/resources",
    SUPPORTPATH: "/opt/senzing/data",
  },
  SQL: {
    CONNECTION: "sqlite3://na:na@/tmp/senzing-config-example.db",
  },
});

// -- Initialize -------------------------------------------------------------
const env = new SzEnvironment("config-example", settings, false);

try {
  const configManager = env.getConfigManager();
  const engine = env.getEngine();

  // -- Step 1: Create a config template from the engine ---------------------
  // createConfig() generates a new config from the built-in template.
  console.log("Creating config template...");
  let configJson = configManager.createConfig();
  console.log(`Template created (${configJson.length} bytes)`);

  // -- Step 2: Inspect the default data sources ----------------------------
  const defaultSources = JSON.parse(listDataSources(configJson));
  console.log(
    `\nDefault data sources: ${defaultSources.map((ds: { DSRC_CODE: string }) => ds.DSRC_CODE).join(", ")}`
  );

  // -- Step 3: Add custom data sources using @senzing/configtool -----------
  // The configtool functions are stateless: they take a config JSON string,
  // return a modified config JSON string.
  console.log("\nAdding custom data sources...");

  configJson = addDataSource(configJson, { code: "CUSTOMERS" });
  console.log("  Added: CUSTOMERS");

  configJson = addDataSource(configJson, { code: "WATCHLIST" });
  console.log("  Added: WATCHLIST");

  configJson = addDataSource(configJson, {
    code: "EMPLOYEES",
    retentionLevel: "Remember",
  });
  console.log("  Added: EMPLOYEES");

  // Verify the data sources were added
  const updatedSources = JSON.parse(listDataSources(configJson));
  console.log(
    `\nAll data sources: ${updatedSources.map((ds: { DSRC_CODE: string }) => ds.DSRC_CODE).join(", ")}`
  );

  // -- Step 4: Register the modified config --------------------------------
  // registerConfig() stores the config in the repository and returns an ID.
  console.log("\nRegistering modified config...");
  const newConfigId = configManager.registerConfig(
    configJson,
    "Added CUSTOMERS, WATCHLIST, and EMPLOYEES data sources"
  );
  console.log(`Registered config ID: ${newConfigId}`);

  // -- Step 5: Set as default config ---------------------------------------
  // Use replaceDefaultConfigId for safe concurrent updates (optimistic locking).
  const currentDefaultId = configManager.getDefaultConfigId();
  console.log(`Current default config ID: ${currentDefaultId}`);

  configManager.replaceDefaultConfigId(currentDefaultId, newConfigId);
  console.log(`Default config updated to: ${newConfigId}`);

  // -- Step 6: Reinitialize the environment --------------------------------
  // The engine must be reinitialized to pick up the new config.
  console.log("\nReinitializing environment...");
  env.reinitialize(newConfigId);
  console.log("Environment reinitialized with new config.");

  // Verify the active config
  const activeConfigId = env.getActiveConfigId();
  console.log(`Active config ID: ${activeConfigId}`);

  // -- Step 7: Use the engine with new data sources ------------------------
  console.log("\nAdding a record to the CUSTOMERS data source...");
  const record = JSON.stringify({
    NAME_FULL: "Robert Smith",
    DATE_OF_BIRTH: "1985-02-15",
    ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
  });

  engine.addRecord("CUSTOMERS", "1001", record, SzFlags.NO_FLAGS);
  console.log("Record added successfully to CUSTOMERS.");

  // -- Step 8: Review the config registry ----------------------------------
  const registry = JSON.parse(configManager.getConfigRegistry());
  console.log(`\nConfig registry has ${registry.CONFIGS?.length ?? 0} entries:`);
  for (const config of registry.CONFIGS ?? []) {
    console.log(
      `  ID: ${config.CONFIG_ID}, Comment: ${config.CONFIG_COMMENT}`
    );
  }

  // -- Alternatively, use setDefaultConfig for a simpler one-step flow -----
  // setDefaultConfig() registers and activates in one operation:
  //
  //   const configId = configManager.setDefaultConfig(
  //     configJson,
  //     "My config comment"
  //   );
  //   env.reinitialize(configId);

  // -- Cleanup --------------------------------------------------------------
  engine.deleteRecord("CUSTOMERS", "1001");
  console.log("\nCleanup complete.");
} finally {
  env.destroy();
  console.log("Environment destroyed.");
}
