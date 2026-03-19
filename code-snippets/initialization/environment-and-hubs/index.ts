/**
 * Environment and Hubs Snippet
 *
 * Demonstrates how to create an SzEnvironment and obtain all four
 * hub interfaces: SzEngine, SzConfigManager, SzDiagnostic, and SzProduct.
 *
 * Run: npx tsx index.ts
 */

import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("env-and-hubs", ["DEMO"]);

try {
  // -- Obtain the four hub interfaces from the environment --------------------

  const engine = env.getEngine();
  console.log("SzEngine:        Entity resolution operations (add/get/search records, export entities)");

  const configManager = env.getConfigManager();
  console.log("SzConfigManager: Manage configuration versions (create, register, set default)");

  const diagnostic = env.getDiagnostic();
  console.log("SzDiagnostic:    System diagnostics (repository info, performance checks, purge)");

  const product = env.getProduct();
  console.log("SzProduct:       Product metadata (version and license information)");

  // -- Quick proof that each hub is functional --------------------------------

  const version = JSON.parse(product.getVersion());
  console.log(`\nSenzing version: ${version.VERSION} (build ${version.BUILD_DATE})`);

  const configId = env.getActiveConfigId();
  console.log(`Active config ID: ${configId}`);

  const repoInfo = JSON.parse(diagnostic.getRepositoryInfo());
  console.log(`Repository info keys: ${Object.keys(repoInfo).join(", ")}`);

  console.log("\nAll four hubs obtained and verified successfully.");
} finally {
  cleanup();
}
