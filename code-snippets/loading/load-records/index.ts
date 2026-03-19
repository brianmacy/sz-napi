/**
 * load-records: Simple demo of adding records and verifying entity resolution.
 *
 * Adds 3 records across two data sources with overlapping attributes,
 * then verifies they resolved together using getEntityByRecord.
 *
 * Usage: npx tsx index.ts
 */

import { SzFlags } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("load-records", [
  "CUSTOMERS",
  "WATCHLIST",
]);

try {
  const engine = env.getEngine();

  // Three people with overlapping attributes that should resolve together.
  const records: Array<{
    dataSource: string;
    recordId: string;
    data: Record<string, string>;
  }> = [
    {
      dataSource: "CUSTOMERS",
      recordId: "C1",
      data: {
        NAME_FULL: "Robert J Smith",
        DATE_OF_BIRTH: "1985-02-15",
        ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
      },
    },
    {
      dataSource: "CUSTOMERS",
      recordId: "C2",
      data: {
        NAME_FULL: "Bob Smith",
        DATE_OF_BIRTH: "2/15/1985",
        PHONE_NUMBER: "702-555-1212",
      },
    },
    {
      dataSource: "WATCHLIST",
      recordId: "W1",
      data: {
        NAME_FULL: "R Smith",
        ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
        PHONE_NUMBER: "702-555-1212",
      },
    },
  ];

  // Add each record with no info flags.
  for (const rec of records) {
    engine.addRecord(
      rec.dataSource,
      rec.recordId,
      JSON.stringify(rec.data),
      SzFlags.NO_FLAGS,
    );
    console.log(`Added ${rec.dataSource}:${rec.recordId}`);
  }

  // Verify resolution — all three records should map to the same entity.
  const entityIds = new Set<number>();

  for (const rec of records) {
    const json = engine.getEntityByRecord(
      rec.dataSource,
      rec.recordId,
      SzFlags.ENTITY_DEFAULT_FLAGS,
    );
    const entity = JSON.parse(json);
    const entityId: number = entity.RESOLVED_ENTITY.ENTITY_ID;
    entityIds.add(entityId);
    const recordCount: number = entity.RESOLVED_ENTITY.RECORDS.length;
    console.log(
      `${rec.dataSource}:${rec.recordId} → Entity ${entityId} (${recordCount} records)`,
    );
  }

  if (entityIds.size === 1) {
    console.log("\nAll 3 records resolved to a single entity.");
  } else {
    console.log(
      `\nRecords resolved to ${entityIds.size} entities: ${[...entityIds].join(", ")}`,
    );
  }
} finally {
  cleanup();
}
