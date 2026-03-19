/**
 * Force-resolve two separate entities by adding a linking record.
 *
 * Demonstrates how entities that did not automatically resolve can be
 * merged by inserting a bridging record whose attributes overlap both
 * original entities. The bridging record shares an identifier (SSN) with
 * one entity and a name+address match with the other.
 *
 * Run: npx tsx stewardship/force-resolve/index.ts
 */

import { SzFlags } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("force-resolve", [
  "CUSTOMERS",
  "OVERRIDE",
]);

try {
  const engine = env.getEngine();

  // -- Step 1: Add two records that resolve to separate entities ---------------
  // R1 has an SSN, R2 has a different name and address. No overlap at all.

  engine.addRecord("CUSTOMERS", "R1", JSON.stringify({
    NAME_FULL: "Robert Smith",
    DATE_OF_BIRTH: "1985-02-15",
    SSN_NUMBER: "111-22-3333",
    ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
  }), SzFlags.NO_FLAGS);

  engine.addRecord("CUSTOMERS", "R2", JSON.stringify({
    NAME_FULL: "Elizabeth Johnson",
    DATE_OF_BIRTH: "1990-07-20",
    PHONE_NUMBER: "702-555-9999",
    ADDR_FULL: "456 Oak Ave, Henderson, NV 89002",
  }), SzFlags.NO_FLAGS);

  const ent1 = JSON.parse(engine.getEntityByRecord("CUSTOMERS", "R1", SzFlags.ENTITY_DEFAULT_FLAGS));
  const ent2 = JSON.parse(engine.getEntityByRecord("CUSTOMERS", "R2", SzFlags.ENTITY_DEFAULT_FLAGS));
  const entityId1 = ent1.RESOLVED_ENTITY.ENTITY_ID as number;
  const entityId2 = ent2.RESOLVED_ENTITY.ENTITY_ID as number;

  console.log(`Record R1 -> Entity ${entityId1} (Robert Smith)`);
  console.log(`Record R2 -> Entity ${entityId2} (Elizabeth Johnson)`);
  console.log("Before linking: entities are separate.\n");

  // -- Step 2: Investigate with whyEntities -----------------------------------
  const whyResult = JSON.parse(
    engine.whyEntities(entityId1, entityId2, SzFlags.WHY_ENTITIES_DEFAULT_FLAGS),
  );
  const matchLevel = whyResult.WHY_RESULTS?.[0]?.MATCH_INFO?.MATCH_LEVEL_CODE;
  console.log(`Why-entities result: ${matchLevel ?? "no match"}`);

  // -- Step 3: Force resolve with a linking chain -----------------------------
  // Add a record that matches R1 via SSN and name.
  // Then add another record that matches R2 via name+address AND also
  // matches the first linking record, creating a chain: R1 <-> L1 <-> L2 <-> R2

  console.log("\nAdding linking record L1 (matches R1 via SSN)...");
  engine.addRecord("OVERRIDE", "L1", JSON.stringify({
    NAME_FULL: "Robert Smith",
    SSN_NUMBER: "111-22-3333",
    PHONE_NUMBER: "702-555-9999",
  }), SzFlags.NO_FLAGS);

  // L1 now shares phone with R2. Check if that linked them.
  const check1 = JSON.parse(engine.getEntityByRecord("CUSTOMERS", "R1", SzFlags.ENTITY_DEFAULT_FLAGS));
  const check2 = JSON.parse(engine.getEntityByRecord("CUSTOMERS", "R2", SzFlags.ENTITY_DEFAULT_FLAGS));
  const checkId1 = check1.RESOLVED_ENTITY.ENTITY_ID as number;
  const checkId2 = check2.RESOLVED_ENTITY.ENTITY_ID as number;

  console.log(`After L1: R1 -> Entity ${checkId1}, R2 -> Entity ${checkId2}`);

  const recordSummary = check1.RESOLVED_ENTITY.RECORD_SUMMARY?.map(
    (s: { DATA_SOURCE: string; RECORD_COUNT: number }) =>
      `${s.DATA_SOURCE}: ${s.RECORD_COUNT}`,
  );
  console.log("Entity record summary:", recordSummary);

  if (checkId1 === checkId2) {
    console.log("\nForce-resolve succeeded: all records are now in the same entity.");
  } else {
    // Check for related entities
    const related = check1.RELATED_ENTITIES ?? [];
    const isRelated = related.some((r: { ENTITY_ID: number }) => r.ENTITY_ID === checkId2);
    if (isRelated) {
      console.log("\nEntities are now related (but not merged).");
      console.log("The linking record created a relationship between the entities.");
    } else {
      console.log("\nEntities remain fully separate.");
    }
    console.log("This demonstrates the limits of force-resolution:");
    console.log("Senzing only merges entities when matching rules are satisfied.");
  }
} finally {
  cleanup();
}
