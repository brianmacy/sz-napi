/**
 * load-with-info: Demonstrates addRecord with the WITH_INFO flag.
 *
 * Loads 10 records in a loop, parses the info JSON returned by the engine,
 * and displays AFFECTED_ENTITIES for each record along with progress.
 *
 * Usage: npx tsx index.ts
 */

import { SzFlags } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("load-with-info", [
  "CUSTOMERS",
]);

try {
  const engine = env.getEngine();

  // 10 records with varied names/addresses that will partially resolve.
  const records = [
    { RECORD_ID: "1001", NAME_FULL: "Robert Smith", DATE_OF_BIRTH: "1985-02-15", ADDR_FULL: "123 Main St, Las Vegas, NV 89101" },
    { RECORD_ID: "1002", NAME_FULL: "Bob J Smith", DATE_OF_BIRTH: "2/15/1985", PHONE_NUMBER: "702-555-1212" },
    { RECORD_ID: "1003", NAME_FULL: "Robert Smith", ADDR_FULL: "123 Main Street, Las Vegas, NV 89101", PHONE_NUMBER: "702-555-1212" },
    { RECORD_ID: "1004", NAME_FULL: "Maria Garcia", DATE_OF_BIRTH: "1990-07-22", ADDR_FULL: "456 Oak Ave, Henderson, NV 89015" },
    { RECORD_ID: "1005", NAME_FULL: "M Garcia", DATE_OF_BIRTH: "7/22/1990", PHONE_NUMBER: "702-555-3434" },
    { RECORD_ID: "1006", NAME_FULL: "Maria T Garcia", ADDR_FULL: "456 Oak Avenue, Henderson, NV 89015", PHONE_NUMBER: "702-555-3434" },
    { RECORD_ID: "1007", NAME_FULL: "James Johnson", DATE_OF_BIRTH: "1978-11-03", ADDR_FULL: "789 Pine Rd, Reno, NV 89501" },
    { RECORD_ID: "1008", NAME_FULL: "Jim Johnson", DATE_OF_BIRTH: "11/3/1978", PHONE_NUMBER: "775-555-6789" },
    { RECORD_ID: "1009", NAME_FULL: "Susan Lee", DATE_OF_BIRTH: "1995-01-30", ADDR_FULL: "321 Elm St, Carson City, NV 89701" },
    { RECORD_ID: "1010", NAME_FULL: "Sue Lee", DATE_OF_BIRTH: "1/30/1995", ADDR_FULL: "321 Elm Street, Carson City, NV 89701" },
  ];

  const total = records.length;

  for (let i = 0; i < total; i++) {
    const rec = records[i];
    const { RECORD_ID, ...attrs } = rec;

    const infoJson = engine.addRecord(
      "CUSTOMERS",
      RECORD_ID,
      JSON.stringify(attrs),
      SzFlags.WITH_INFO,
    );

    const info = JSON.parse(infoJson);
    const affected: Array<{ ENTITY_ID: number }> = info.AFFECTED_ENTITIES ?? [];
    const entityIds = affected.map((e) => e.ENTITY_ID).join(", ");

    console.log(
      `Loaded ${i + 1}/${total} records | ` +
        `CUSTOMERS:${RECORD_ID} → AFFECTED_ENTITIES: [${entityIds}]`,
    );
  }

  console.log(`\nDone. ${total} records loaded.`);
} finally {
  cleanup();
}
