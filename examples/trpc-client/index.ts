/**
 * tRPC Client Example
 *
 * Demonstrates using the @senzing/trpc client to talk to a remote
 * Senzing server — no native Senzing libraries needed on this machine.
 *
 * This example:
 * - Connects to the tRPC server
 * - Fetches product version and license info
 * - Adds a record and gets WITH_INFO back
 * - Searches by attributes
 * - Retrieves an entity by ID
 * - Runs a why analysis between two records
 * - Gets engine stats
 * - Cleans up by deleting the test record
 *
 * Prerequisites:
 *   - The trpc-server example running (cd ../trpc-server && npm start)
 *
 * Usage:
 *   npm start                                        # Connects to localhost:3000
 *   SERVER_URL=http://remote:8080/trpc npm start     # Connects to a remote server
 */

import { createSzClient } from "@senzing/trpc/client";

const serverUrl = process.env.SERVER_URL || "http://localhost:3000/trpc";
const sz = createSzClient({ url: serverUrl });

console.log(`Connecting to Senzing tRPC server at ${serverUrl}\n`);

// -- Product info -------------------------------------------------------------
const version = await sz.product.getVersion.query();
console.log(`Senzing version: ${version.VERSION}`);
console.log(`Build date:      ${version.BUILD_DATE}`);

const license = await sz.product.getLicense.query();
console.log(`License type:    ${license.licenseType}\n`);

// -- Add a record with WITH_INFO ----------------------------------------------
// WITH_INFO flag (bit 62) is a bigint — superjson handles serialization.
const WITH_INFO = 1n << 62n;

const info = await sz.engine.addRecord.mutate({
  dataSourceCode: "CUSTOMERS",
  recordId: "CLIENT-2001",
  recordDefinition: JSON.stringify({
    NAME_FULL: "Robert Smith",
    DATE_OF_BIRTH: "1985-02-15",
    ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
  }),
  flags: WITH_INFO,
});
console.log("Added record CLIENT-2001:");
console.log(JSON.stringify(info, null, 2));

// -- Get entity by record -----------------------------------------------------
const entity = await sz.engine.getEntityByRecord.query({
  dataSourceCode: "CUSTOMERS",
  recordId: "CLIENT-2001",
});
const entityId = entity.RESOLVED_ENTITY.ENTITY_ID;
console.log(`\nResolved entity ID: ${entityId}`);
console.log(
  `Records in entity: ${entity.RESOLVED_ENTITY.RECORDS?.length ?? 0}`
);

// -- Search by attributes -----------------------------------------------------
const searchResults = await sz.engine.searchByAttributes.query({
  attributes: JSON.stringify({
    NAME_FULL: "Bob Smith",
    ADDR_FULL: "123 Main St, Las Vegas, NV",
  }),
});
console.log(
  `\nSearch returned ${searchResults.RESOLVED_ENTITIES?.length ?? 0} entities:`
);
for (const match of searchResults.RESOLVED_ENTITIES ?? []) {
  console.log(
    `  Entity ${match.ENTITY.RESOLVED_ENTITY.ENTITY_ID} — ` +
      `match key: ${match.MATCH_INFO.MATCH_KEY}`
  );
}

// -- Get entity by ID ---------------------------------------------------------
console.log(`\nFetching entity ${entityId} by ID...`);
const byId = await sz.engine.getEntityById.query({ entityId });
console.log(
  `Entity name: ${byId.RESOLVED_ENTITY.ENTITY_NAME ?? "(unnamed)"}`
);

// -- Why analysis -------------------------------------------------------------
// If our record resolved with the server's pre-loaded CUSTOMERS/1001,
// we can ask "why" they resolved together.
const records = entity.RESOLVED_ENTITY.RECORDS ?? [];
if (records.length > 1) {
  const rec1 = records[0];
  const rec2 = records[1];
  console.log(
    `\nWhy did ${rec1.DATA_SOURCE}/${rec1.RECORD_ID} resolve with ` +
      `${rec2.DATA_SOURCE}/${rec2.RECORD_ID}?`
  );
  const why = await sz.engine.whyRecords.query({
    dsCode1: rec1.DATA_SOURCE,
    recId1: rec1.RECORD_ID,
    dsCode2: rec2.DATA_SOURCE,
    recId2: rec2.RECORD_ID,
  });
  console.log(JSON.stringify(why, null, 2));
}

// -- Engine stats -------------------------------------------------------------
const stats = await sz.engine.getStats.query();
console.log("\nEngine stats:");
console.log(JSON.stringify(stats, null, 2));

// -- Cleanup ------------------------------------------------------------------
await sz.engine.deleteRecord.mutate({
  dataSourceCode: "CUSTOMERS",
  recordId: "CLIENT-2001",
});
console.log("\nDeleted record CLIENT-2001.");

console.log("\nDone!");
