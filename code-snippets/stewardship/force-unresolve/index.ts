/**
 * Force-unresolve (separate) entities by deleting a linking record.
 *
 * Demonstrates how three records that automatically resolve into one
 * entity can be split apart by removing the bridging record that
 * connects them.
 *
 * Run: npx tsx stewardship/force-unresolve/index.ts
 */

import { SzFlags } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("force-unresolve", [
  "CUSTOMERS",
]);

try {
  const engine = env.getEngine();

  // -- Step 1: Add three records that resolve together ------------------------
  //
  // R1 and R2 share an SSN.  R2 and R3 share a phone number.
  // Together they form a single entity chain: R1 <-SSN-> R2 <-PHONE-> R3.

  const record1 = JSON.stringify({
    NAME_FULL: "Robert Smith",
    SSN_NUMBER: "111-22-3333",
  });

  const record2 = JSON.stringify({
    NAME_FULL: "R Smith",
    SSN_NUMBER: "111-22-3333",
    PHONE_NUMBER: "702-555-9999",
  });

  const record3 = JSON.stringify({
    NAME_FULL: "Bob Jones",
    PHONE_NUMBER: "702-555-9999",
  });

  engine.addRecord("CUSTOMERS", "R1", record1);
  engine.addRecord("CUSTOMERS", "R2", record2);
  const info3 = JSON.parse(
    engine.addRecord("CUSTOMERS", "R3", record3, SzFlags.WITH_INFO),
  );

  // -- Step 2: Verify all three are in the same entity ------------------------

  const entity1 = JSON.parse(
    engine.getEntityByRecord("CUSTOMERS", "R1", SzFlags.ENTITY_DEFAULT_FLAGS),
  );
  const entity2 = JSON.parse(
    engine.getEntityByRecord("CUSTOMERS", "R2", SzFlags.ENTITY_DEFAULT_FLAGS),
  );
  const entity3 = JSON.parse(
    engine.getEntityByRecord("CUSTOMERS", "R3", SzFlags.ENTITY_DEFAULT_FLAGS),
  );

  const id1 = entity1.RESOLVED_ENTITY.ENTITY_ID as number;
  const id2 = entity2.RESOLVED_ENTITY.ENTITY_ID as number;
  const id3 = entity3.RESOLVED_ENTITY.ENTITY_ID as number;

  console.log(`Before deletion: R1 -> Entity ${id1}, R2 -> Entity ${id2}, R3 -> Entity ${id3}`);
  console.assert(id1 === id2 && id2 === id3, "All three records should be in one entity");
  console.log(
    "Record summary:",
    entity1.RESOLVED_ENTITY.RECORD_SUMMARY?.map(
      (s: { DATA_SOURCE: string; RECORD_COUNT: number }) =>
        `${s.DATA_SOURCE}: ${s.RECORD_COUNT}`,
    ),
  );
  console.log("\nAll three records are in a single entity.\n");

  // -- Step 3: Delete the linking record (R2) to split the entity -------------

  console.log("Deleting bridging record R2...");
  const deleteInfo = JSON.parse(
    engine.deleteRecord("CUSTOMERS", "R2", SzFlags.WITH_INFO),
  );
  console.log(
    "Affected entities:",
    deleteInfo.AFFECTED_ENTITIES.map(
      (e: { ENTITY_ID: number }) => e.ENTITY_ID,
    ),
  );

  // -- Step 4: Verify R1 and R3 are now in separate entities ------------------

  const after1 = JSON.parse(
    engine.getEntityByRecord("CUSTOMERS", "R1", SzFlags.ENTITY_DEFAULT_FLAGS),
  );
  const after3 = JSON.parse(
    engine.getEntityByRecord("CUSTOMERS", "R3", SzFlags.ENTITY_DEFAULT_FLAGS),
  );

  const afterId1 = after1.RESOLVED_ENTITY.ENTITY_ID as number;
  const afterId3 = after3.RESOLVED_ENTITY.ENTITY_ID as number;

  console.log(`\nAfter deletion: R1 -> Entity ${afterId1}, R3 -> Entity ${afterId3}`);

  if (afterId1 !== afterId3) {
    console.log("\nForce-unresolve succeeded: R1 and R3 are in separate entities.");
  } else {
    console.error("\nForce-unresolve failed: R1 and R3 are still in the same entity.");
    process.exitCode = 1;
  }
} finally {
  cleanup();
}
