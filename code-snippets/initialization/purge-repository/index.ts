/**
 * Purge Repository Snippet
 *
 * Demonstrates adding records, inspecting entity/redo counts, then
 * purging all entity data while preserving the configuration.
 *
 * Run: npx tsx index.ts
 */

import { SzFlags } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("purge-repo", ["DEMO"]);

try {
  const engine = env.getEngine();
  const diagnostic = env.getDiagnostic();

  // -- Add a few records ------------------------------------------------------

  engine.addRecord(
    "DEMO",
    "1001",
    JSON.stringify({
      NAME_FULL: "Robert Smith",
      DATE_OF_BIRTH: "1985-02-15",
      ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
    }),
    SzFlags.NO_FLAGS,
  );

  engine.addRecord(
    "DEMO",
    "1002",
    JSON.stringify({
      NAME_FULL: "Jane Doe",
      DATE_OF_BIRTH: "1990-07-20",
      EMAIL_ADDRESS: "jane.doe@example.com",
    }),
    SzFlags.NO_FLAGS,
  );

  engine.addRecord(
    "DEMO",
    "1003",
    JSON.stringify({
      NAME_FULL: "Bob Smith",
      DATE_OF_BIRTH: "2/15/1985",
      ADDR_FULL: "123 Main Street, Las Vegas, NV 89101",
    }),
    SzFlags.NO_FLAGS,
  );

  console.log("Added 3 records.");

  // -- Check counts before purge ----------------------------------------------

  const redoBefore = engine.countRedoRecords();
  console.log(`Redo records before purge: ${redoBefore}`);

  let entityCount = 0;
  for (const _ of engine.exportJsonEntityReport(SzFlags.EXPORT_DEFAULT_FLAGS)) {
    entityCount++;
  }
  console.log(`Entities before purge: ${entityCount}`);

  // -- Purge all entity data --------------------------------------------------

  console.log("\nPurging repository (deletes all entity data, preserves config)...");
  diagnostic.purgeRepository();
  console.log("Purge complete.");

  // -- Verify counts after purge ----------------------------------------------

  const redoAfter = engine.countRedoRecords();
  console.log(`\nRedo records after purge: ${redoAfter}`);

  let entityCountAfter = 0;
  for (const _ of engine.exportJsonEntityReport(SzFlags.EXPORT_DEFAULT_FLAGS)) {
    entityCountAfter++;
  }
  console.log(`Entities after purge: ${entityCountAfter}`);

  // -- Confirm the config is still intact -------------------------------------

  const configId = env.getActiveConfigId();
  console.log(`\nActive config ID (preserved): ${configId}`);
} finally {
  cleanup();
}
