/**
 * Why Search Snippet
 *
 * Demonstrates the "why" analysis APIs: whyEntities and whySearch.
 * Adds records to create multiple entities, uses searchByAttributes to
 * find matches, then analyzes WHY two entities resolved (whyEntities)
 * and WHY a search matched a particular entity (whySearch).
 *
 * Run: npx tsx index.ts
 */

import { SzFlags } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("why-search", [
  "CUSTOMERS",
  "WATCHLIST",
]);

try {
  const engine = env.getEngine();

  // -- Add records to create entities -----------------------------------------
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
        NAME_FULL: "Jane Doe",
        DATE_OF_BIRTH: "1990-07-20",
        ADDR_FULL: "456 Oak Ave, Henderson, NV 89002",
        EMAIL_ADDRESS: "jane.doe@example.com",
      },
    },
    {
      ds: "WATCHLIST",
      id: "W2002",
      data: {
        NAME_FULL: "Maria Garcia",
        ADDR_FULL: "789 Pine Rd, Reno, NV 89501",
        PHONE_NUMBER: "775-555-9876",
      },
    },
  ];

  console.log("Adding records...");
  for (const rec of records) {
    engine.addRecord(rec.ds, rec.id, JSON.stringify(rec.data), SzFlags.NO_FLAGS);
    console.log(`  Added ${rec.ds}/${rec.id}`);
  }

  // -- Retrieve entity IDs for the records ------------------------------------
  const entity1Json = engine.getEntityByRecord(
    "CUSTOMERS",
    "C1001",
    SzFlags.ENTITY_DEFAULT_FLAGS,
  );
  const entity1Id: number = JSON.parse(entity1Json).RESOLVED_ENTITY.ENTITY_ID;

  const entity2Json = engine.getEntityByRecord(
    "WATCHLIST",
    "W2001",
    SzFlags.ENTITY_DEFAULT_FLAGS,
  );
  const entity2Id: number = JSON.parse(entity2Json).RESOLVED_ENTITY.ENTITY_ID;

  console.log(`\nEntity for CUSTOMERS/C1001: ${entity1Id}`);
  console.log(`Entity for WATCHLIST/W2001: ${entity2Id}`);

  // -- searchByAttributes to find a match -------------------------------------
  const searchAttrs = JSON.stringify({
    NAME_FULL: "Robert Smith",
    ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
  });

  console.log("\n--- searchByAttributes ---");
  console.log("Searching for: Robert Smith @ 123 Main St, Las Vegas, NV 89101");

  const searchResult = engine.searchByAttributes(
    searchAttrs,
    undefined,
    SzFlags.SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS,
  );
  const searchParsed = JSON.parse(searchResult);
  const matchedEntities = searchParsed.RESOLVED_ENTITIES ?? [];

  console.log(`Search returned ${matchedEntities.length} entity(ies)`);
  for (const match of matchedEntities) {
    const eid = match.ENTITY?.RESOLVED_ENTITY?.ENTITY_ID;
    const matchKey = match.MATCH_INFO?.MATCH_KEY ?? "(none)";
    console.log(`  Entity ${eid} | Match Key: ${matchKey}`);
  }

  // -- whyEntities: compare two entity IDs ------------------------------------
  console.log("\n--- whyEntities ---");
  console.log(`Comparing entity ${entity1Id} vs entity ${entity2Id}...`);

  const whyEntitiesResult = engine.whyEntities(
    entity1Id,
    entity2Id,
    SzFlags.WHY_ENTITIES_DEFAULT_FLAGS,
  );
  const whyEntitiesParsed = JSON.parse(whyEntitiesResult);
  const whyResults = whyEntitiesParsed.WHY_RESULTS ?? [];

  console.log(`WHY_RESULTS count: ${whyResults.length}`);
  for (const why of whyResults) {
    console.log(`  Entity ID 1:  ${why.ENTITY_ID}`);
    console.log(`  Entity ID 2:  ${why.ENTITY_ID_2}`);
    const matchInfo = why.MATCH_INFO ?? {};
    console.log(`  Match Key:    ${matchInfo.MATCH_KEY ?? "(none)"}`);
    console.log(`  Rule Code:    ${matchInfo.WHY_KEY ?? "(none)"}`);
    console.log(`  Err Rule:     ${matchInfo.WHY_ERRULE_CODE ?? "(none)"}`);

    const candidateKeys = matchInfo.CANDIDATE_KEYS ?? {};
    const candidateFeatures = Object.keys(candidateKeys);
    if (candidateFeatures.length > 0) {
      console.log("  Candidate Keys:");
      for (const feat of candidateFeatures) {
        const values = candidateKeys[feat].map(
          (k: { FEAT_ID: number; FEAT_DESC: string }) => k.FEAT_DESC,
        );
        console.log(`    ${feat}: ${values.join(", ")}`);
      }
    }
    console.log();
  }

  // -- whySearch: analyze why a search matched an entity ----------------------
  // Use the first matched entity from the earlier search
  if (matchedEntities.length > 0) {
    const targetEntityId: number =
      matchedEntities[0].ENTITY.RESOLVED_ENTITY.ENTITY_ID;

    console.log("--- whySearch ---");
    console.log(
      `Analyzing why search attributes matched entity ${targetEntityId}...`,
    );

    const whySearchResult = engine.whySearch(
      searchAttrs,
      targetEntityId,
      undefined,
      SzFlags.WHY_ENTITIES_DEFAULT_FLAGS,
    );
    const whySearchParsed = JSON.parse(whySearchResult);
    const whySearchResults = whySearchParsed.WHY_RESULTS ?? [];

    console.log(`WHY_RESULTS count: ${whySearchResults.length}`);
    for (const why of whySearchResults) {
      console.log(`  Entity ID:    ${why.ENTITY_ID}`);
      const matchInfo = why.MATCH_INFO ?? {};
      console.log(`  Match Key:    ${matchInfo.MATCH_KEY ?? "(none)"}`);
      console.log(`  Rule Code:    ${matchInfo.WHY_KEY ?? "(none)"}`);
      console.log(`  Err Rule:     ${matchInfo.WHY_ERRULE_CODE ?? "(none)"}`);

      const candidateKeys = matchInfo.CANDIDATE_KEYS ?? {};
      const candidateFeatures = Object.keys(candidateKeys);
      if (candidateFeatures.length > 0) {
        console.log("  Candidate Keys:");
        for (const feat of candidateFeatures) {
          const values = candidateKeys[feat].map(
            (k: { FEAT_ID: number; FEAT_DESC: string }) => k.FEAT_DESC,
          );
          console.log(`    ${feat}: ${values.join(", ")}`);
        }
      }
      console.log();
    }
  }

  console.log("Done.");
} finally {
  cleanup();
}
