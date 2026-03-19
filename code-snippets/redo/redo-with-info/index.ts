/**
 * Redo With Info
 *
 * Demonstrates processing redo records with the WITH_INFO flag to obtain
 * details about affected entities. Parses and displays the info JSON
 * returned by processRedoRecord.
 *
 * Usage: npx tsx index.ts
 */

import { SzFlags } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("redo-with-info", [
  "CUSTOMERS",
  "WATCHLIST",
]);

try {
  const engine = env.getEngine();

  // -- Load overlapping records to generate redo work -------------------------
  const customerRecords = [
    {
      NAME_FULL: "John Smith",
      ADDR_FULL: "123 Main St",
      SSN_NUMBER: "111-22-3333",
    },
    {
      NAME_FULL: "J Smith",
      ADDR_FULL: "123 Main Street",
      PHONE_NUMBER: "555-1212",
    },
    {
      NAME_FULL: "Johnny Smith",
      SSN_NUMBER: "111-22-3333",
    },
    {
      NAME_FULL: "John A Smith",
      ADDR_FULL: "123 Main St Apt 1",
      PHONE_NUMBER: "555-1212",
    },
  ];

  const watchlistRecords = [
    {
      NAME_FULL: "John Smith",
      SSN_NUMBER: "111-22-3333",
      DATE_OF_BIRTH: "1985-03-15",
    },
    {
      NAME_FULL: "Jane Doe",
      ADDR_FULL: "456 Oak Ave",
      SSN_NUMBER: "444-55-6666",
    },
    {
      NAME_FULL: "J Doe",
      ADDR_FULL: "456 Oak Avenue",
      PHONE_NUMBER: "555-3434",
    },
  ];

  console.log("Loading CUSTOMERS records...");
  for (let i = 0; i < customerRecords.length; i++) {
    engine.addRecord("CUSTOMERS", `C${i + 1}`, JSON.stringify(customerRecords[i]));
  }
  console.log(`  Loaded ${customerRecords.length} CUSTOMERS records.`);

  console.log("Loading WATCHLIST records...");
  for (let i = 0; i < watchlistRecords.length; i++) {
    engine.addRecord("WATCHLIST", `W${i + 1}`, JSON.stringify(watchlistRecords[i]));
  }
  console.log(`  Loaded ${watchlistRecords.length} WATCHLIST records.`);

  // -- Process redo records with WITH_INFO flag -------------------------------
  console.log("\nProcessing redo records with WITH_INFO...\n");
  let processed = 0;

  while (true) {
    const count = engine.countRedoRecords();
    if (count === 0) break;

    const redo = engine.getRedoRecord();
    if (!redo) break;

    const infoJson = engine.processRedoRecord(redo, SzFlags.WITH_INFO);
    processed++;

    // Parse and display affected entities
    if (infoJson) {
      const info = JSON.parse(infoJson);
      const affected = info.AFFECTED_ENTITIES ?? [];
      const entityIds = affected.map(
        (e: { ENTITY_ID: number }) => e.ENTITY_ID,
      );
      console.log(`  Redo #${processed}: affected entities: [${entityIds.join(", ")}]`);
    } else {
      console.log(`  Redo #${processed}: (no info returned)`);
    }
  }

  console.log(`\nDone. Processed ${processed} redo records with info.`);
} finally {
  cleanup();
}
