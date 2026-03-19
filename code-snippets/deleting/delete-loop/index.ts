/**
 * Delete Loop Snippet
 *
 * Demonstrates batch deletion of records in a loop:
 * - Adding multiple records in a batch
 * - Deleting all records with progress tracking
 * - Using WITH_INFO to report affected entities during deletion
 * - Printing a summary of the operation
 *
 * Run: npx tsx index.ts
 */

import { SzFlags } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("delete-loop", ["CUSTOMERS"]);

try {
  const engine = env.getEngine();

  // -- Define records to load -----------------------------------------------
  const records = [
    { RECORD_ID: "D001", NAME_FULL: "Alice Johnson", ADDR_FULL: "100 First Ave, Portland, OR 97201" },
    { RECORD_ID: "D002", NAME_FULL: "Bob Williams", ADDR_FULL: "200 Second St, Portland, OR 97202" },
    { RECORD_ID: "D003", NAME_FULL: "Carol Davis", ADDR_FULL: "300 Third Blvd, Portland, OR 97203" },
    { RECORD_ID: "D004", NAME_FULL: "David Brown", ADDR_FULL: "400 Fourth Dr, Portland, OR 97204" },
    { RECORD_ID: "D005", NAME_FULL: "Eve Martinez", ADDR_FULL: "500 Fifth Ln, Portland, OR 97205" },
    { RECORD_ID: "D006", NAME_FULL: "Frank Garcia", ADDR_FULL: "600 Sixth Ct, Portland, OR 97206" },
    { RECORD_ID: "D007", NAME_FULL: "Grace Lee", ADDR_FULL: "700 Seventh Way, Portland, OR 97207" },
    { RECORD_ID: "D008", NAME_FULL: "Hank Wilson", ADDR_FULL: "800 Eighth Pl, Portland, OR 97208" },
    { RECORD_ID: "D009", NAME_FULL: "Iris Taylor", ADDR_FULL: "900 Ninth Ave, Portland, OR 97209" },
    { RECORD_ID: "D010", NAME_FULL: "Jack Thomas", ADDR_FULL: "1000 Tenth St, Portland, OR 97210" },
  ];

  // -- Add all records in a batch -------------------------------------------
  console.log(`Adding ${records.length} records...`);
  for (const rec of records) {
    engine.addRecord("CUSTOMERS", rec.RECORD_ID, JSON.stringify(rec));
  }
  console.log(`  Added ${records.length} records.\n`);

  // -- Delete all records in a loop with progress ---------------------------
  const total = records.length;
  const affectedEntities = new Set<number>();

  console.log(`Deleting ${total} records...`);
  for (let i = 0; i < total; i++) {
    const rec = records[i];
    const info = engine.deleteRecord("CUSTOMERS", rec.RECORD_ID, SzFlags.WITH_INFO);

    // Collect affected entity IDs from the WITH_INFO response
    const parsed = JSON.parse(info);
    for (const ent of parsed.AFFECTED_ENTITIES ?? []) {
      affectedEntities.add(ent.ENTITY_ID);
    }

    const count = i + 1;
    if (count % 5 === 0 || count === total) {
      console.log(`  Deleted ${count}/${total} records`);
    }
  }

  // -- Summary --------------------------------------------------------------
  console.log("\n--- Summary ---");
  console.log(`  Records deleted:    ${total}`);
  console.log(`  Affected entities:  ${affectedEntities.size}`);
  console.log(`  Entity IDs:         [${[...affectedEntities].join(", ")}]`);

  console.log("\nDone.");
} finally {
  cleanup();
}
