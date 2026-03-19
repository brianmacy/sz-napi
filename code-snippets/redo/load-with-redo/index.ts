/**
 * Load With Redo
 *
 * Two-phase pattern: first load all records (Load phase), then process
 * all redo records that were generated (Redo phase). Prints stats for
 * each phase.
 *
 * Usage: npx tsx index.ts
 */

import { SzFlags } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("load-with-redo", [
  "CUSTOMERS",
  "WATCHLIST",
]);

try {
  const engine = env.getEngine();

  // -- Phase 1: Load records --------------------------------------------------
  console.log("=== Phase 1: Load ===");
  const loadStart = performance.now();

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

  for (let i = 0; i < customerRecords.length; i++) {
    engine.addRecord("CUSTOMERS", `C${i + 1}`, JSON.stringify(customerRecords[i]));
  }
  for (let i = 0; i < watchlistRecords.length; i++) {
    engine.addRecord("WATCHLIST", `W${i + 1}`, JSON.stringify(watchlistRecords[i]));
  }

  const loadElapsed = performance.now() - loadStart;
  const totalLoaded = customerRecords.length + watchlistRecords.length;
  console.log(`  Loaded ${totalLoaded} records in ${loadElapsed.toFixed(0)} ms`);
  console.log(`    CUSTOMERS:  ${customerRecords.length}`);
  console.log(`    WATCHLIST:  ${watchlistRecords.length}`);

  // -- Phase 2: Process redo records ------------------------------------------
  console.log("\n=== Phase 2: Redo ===");
  const redoStart = performance.now();
  let processed = 0;

  const pending = engine.countRedoRecords();
  console.log(`  Redo records pending: ${pending}`);

  while (true) {
    const count = engine.countRedoRecords();
    if (count === 0) break;

    const redo = engine.getRedoRecord();
    if (!redo) break;

    engine.processRedoRecord(redo, SzFlags.NO_FLAGS);
    processed++;
  }

  const redoElapsed = performance.now() - redoStart;
  console.log(`  Processed ${processed} redo records in ${redoElapsed.toFixed(0)} ms`);

  // -- Summary ----------------------------------------------------------------
  console.log("\n=== Summary ===");
  console.log(`  Records loaded:        ${totalLoaded}`);
  console.log(`  Redo records processed: ${processed}`);
  console.log(
    `  Total time:            ${(loadElapsed + redoElapsed).toFixed(0)} ms`,
  );
} finally {
  cleanup();
}
