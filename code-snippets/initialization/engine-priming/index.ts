/**
 * Engine Priming Snippet
 *
 * Demonstrates how to call primeEngine() to pre-load internal caches,
 * reducing latency for subsequent entity resolution operations.
 *
 * Run: npx tsx index.ts
 */

import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("engine-priming", ["DEMO"]);

try {
  const engine = env.getEngine();

  console.log("Priming engine (loading internal caches)...");
  const start = performance.now();
  engine.primeEngine();
  const elapsed = performance.now() - start;

  console.log(`Engine primed in ${elapsed.toFixed(1)} ms`);
  console.log("Subsequent operations will benefit from cached data.");
} finally {
  cleanup();
}
