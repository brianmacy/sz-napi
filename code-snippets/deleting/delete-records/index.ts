/**
 * Delete Records Snippet
 *
 * Demonstrates deleting individual records from the Senzing engine:
 * - Adding records and verifying entity resolution
 * - Deleting records (with and without WITH_INFO)
 * - Confirming the resolved entity no longer exists
 *
 * Run: npx tsx index.ts
 */

import { SzFlags, SzNotFoundError } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("delete-records", ["CUSTOMERS"]);

try {
  const engine = env.getEngine();

  // -- Add three records that will resolve into one entity -------------------
  const records = [
    { RECORD_ID: "D001", NAME_FULL: "Alice Johnson", ADDR_FULL: "100 First Ave, Portland, OR 97201" },
    { RECORD_ID: "D002", NAME_FULL: "Alice M Johnson", ADDR_FULL: "100 First Ave, Portland, OR 97201" },
    { RECORD_ID: "D003", NAME_FULL: "A. Johnson", ADDR_FULL: "100 1st Avenue, Portland, OR 97201" },
  ];

  console.log("Adding records...");
  for (const rec of records) {
    engine.addRecord("CUSTOMERS", rec.RECORD_ID, JSON.stringify(rec));
    console.log(`  Added ${rec.RECORD_ID}`);
  }

  // -- Verify the entity exists via the first record ------------------------
  console.log("\nVerifying entity exists for CUSTOMERS/D001...");
  const entityJson = engine.getEntityByRecord(
    "CUSTOMERS",
    "D001",
    SzFlags.ENTITY_DEFAULT_FLAGS,
  );
  const entity = JSON.parse(entityJson);
  console.log(`  Entity ID: ${entity.RESOLVED_ENTITY.ENTITY_ID}`);
  console.log(`  Records in entity: ${entity.RESOLVED_ENTITY.RECORDS?.length ?? 0}`);

  // -- Delete each record ---------------------------------------------------
  console.log("\nDeleting records...");

  // Delete the first record with WITH_INFO to see affected entities
  const info = engine.deleteRecord("CUSTOMERS", "D001", SzFlags.WITH_INFO);
  console.log(`  Deleted D001 (WITH_INFO): ${info}`);

  // Delete remaining records without info
  engine.deleteRecord("CUSTOMERS", "D002");
  console.log("  Deleted D002");

  engine.deleteRecord("CUSTOMERS", "D003");
  console.log("  Deleted D003");

  // -- Verify the entity no longer exists -----------------------------------
  console.log("\nVerifying entity is gone...");
  try {
    engine.getEntityByRecord("CUSTOMERS", "D001", SzFlags.ENTITY_DEFAULT_FLAGS);
    console.log("  ERROR: Entity still exists (unexpected)");
  } catch (e) {
    if (e instanceof SzNotFoundError) {
      console.log("  Confirmed: entity no longer exists (SzNotFoundError)");
    } else {
      throw e;
    }
  }

  console.log("\nDone.");
} finally {
  cleanup();
}
