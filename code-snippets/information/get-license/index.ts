/**
 * Retrieves and displays the Senzing SDK license information.
 *
 * Usage: npx tsx index.ts
 */

import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("get-license");
try {
  const product = env.getProduct();
  const licenseJson = product.getLicense();
  const license = JSON.parse(licenseJson);

  console.log("Senzing License Information");
  console.log("---------------------------");
  console.log(`  License Type: ${license.licenseType}`);
  console.log(`  Expire Date:  ${license.expireDate}`);
  console.log(`  Record Limit: ${license.recordLimit}`);
  console.log(`  Contract:     ${license.contract}`);
} finally {
  cleanup();
}
