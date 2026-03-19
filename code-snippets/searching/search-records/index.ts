/**
 * Search Records Snippet
 *
 * Demonstrates how to add records with overlapping attributes and then
 * use searchByAttributes to find matching entities. Parses the search
 * results to display entity IDs, match keys, and match scores.
 *
 * Run: npx tsx index.ts
 */

import { SzFlags } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("search-records", [
  "CUSTOMERS",
  "WATCHLIST",
]);

try {
  const engine = env.getEngine();

  // -- Add records with overlapping attributes --------------------------------
  const records = [
    {
      ds: "CUSTOMERS",
      id: "C1001",
      data: {
        NAME_FULL: "Robert Smith",
        DATE_OF_BIRTH: "1985-02-15",
        ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
        SSN_NUMBER: "111-22-3333",
      },
    },
    {
      ds: "CUSTOMERS",
      id: "C1002",
      data: {
        NAME_FULL: "Bob Smith",
        DATE_OF_BIRTH: "2/15/1985",
        ADDR_FULL: "123 Main Street, Las Vegas, NV 89101",
        PHONE_NUMBER: "702-555-1212",
      },
    },
    {
      ds: "WATCHLIST",
      id: "W2001",
      data: {
        NAME_FULL: "R Smith",
        ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
        SSN_NUMBER: "111-22-3333",
      },
    },
    {
      ds: "CUSTOMERS",
      id: "C1003",
      data: {
        NAME_FULL: "Jane Doe",
        DATE_OF_BIRTH: "1990-07-20",
        ADDR_FULL: "456 Oak Ave, Henderson, NV 89002",
        EMAIL_ADDRESS: "jane.doe@example.com",
      },
    },
  ];

  console.log("Adding records...");
  for (const rec of records) {
    engine.addRecord(rec.ds, rec.id, JSON.stringify(rec.data), SzFlags.NO_FLAGS);
    console.log(`  Added ${rec.ds}/${rec.id}`);
  }

  // -- Search by attributes ---------------------------------------------------
  const searchAttrs = JSON.stringify({
    NAME_FULL: "Robert Smith",
    ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
  });

  console.log("\nSearching for: Robert Smith @ 123 Main St, Las Vegas, NV 89101");
  const searchResult = engine.searchByAttributes(
    searchAttrs,
    undefined,
    SzFlags.SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS,
  );

  const parsed = JSON.parse(searchResult);
  const entities = parsed.RESOLVED_ENTITIES ?? [];

  console.log(`\nSearch returned ${entities.length} matching entity(ies):\n`);

  for (const match of entities) {
    const entityId = match.ENTITY?.RESOLVED_ENTITY?.ENTITY_ID;
    const matchKey = match.MATCH_INFO?.MATCH_KEY ?? "(none)";
    const matchScore = match.MATCH_INFO?.MATCH_SCORE ?? "(none)";
    const ruleCode = match.MATCH_INFO?.WHY_KEY ?? "(none)";
    const recordCount = match.ENTITY?.RESOLVED_ENTITY?.RECORDS?.length ?? 0;

    console.log(`  Entity ID:    ${entityId}`);
    console.log(`  Match Key:    ${matchKey}`);
    console.log(`  Match Score:  ${matchScore}`);
    console.log(`  Why Key:      ${ruleCode}`);
    console.log(`  Record Count: ${recordCount}`);

    const records = match.ENTITY?.RESOLVED_ENTITY?.RECORDS ?? [];
    for (const rec of records) {
      console.log(`    - ${rec.DATA_SOURCE}/${rec.RECORD_ID}`);
    }
    console.log();
  }

  console.log("Done.");
} finally {
  cleanup();
}
