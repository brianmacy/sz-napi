/**
 * Checks the performance of the Senzing datastore repository.
 *
 * Usage: npx tsx index.ts
 */

import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("check-perf", ["DEMO"]);
try {
  const diagnostic = env.getDiagnostic();

  console.log("Checking datastore performance (3 seconds)...");
  const resultJson = diagnostic.checkRepositoryPerformance(3);
  const result = JSON.parse(resultJson);

  console.log("\nDatastore Performance Results");
  console.log("-----------------------------");
  for (const [key, value] of Object.entries(result)) {
    console.log(`  ${key}: ${value}`);
  }
} finally {
  cleanup();
}
