/**
 * Retrieves and displays the Senzing SDK version information.
 *
 * Usage: npx tsx index.ts
 */

import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("get-version");
try {
  const product = env.getProduct();
  const versionJson = product.getVersion();
  const version = JSON.parse(versionJson);

  console.log("Senzing Version Information");
  console.log("---------------------------");
  console.log(`  VERSION:            ${version.VERSION}`);
  console.log(`  BUILD_DATE:         ${version.BUILD_DATE}`);
  console.log(`  BUILD_NUMBER:       ${version.BUILD_NUMBER}`);
  console.log(`  NATIVE_API_VERSION: ${version.NATIVE_API_VERSION}`);
} finally {
  cleanup();
}
