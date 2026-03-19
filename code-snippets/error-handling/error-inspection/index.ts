/**
 * Error Inspection Snippet
 *
 * Demonstrates the Senzing SDK error hierarchy by triggering several error
 * types and inspecting their properties, instanceof chains, and helper methods.
 *
 * Run: npx tsx index.ts
 */

import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";
import {
  SzError,
  SzBadInputError,
  SzNotFoundError,
  SzUnknownDataSourceError,
  SzRetryableError,
  SzUnrecoverableError,
  SzFlags,
} from "@senzing/sdk";

/** Prints detailed error information for an SzError instance. */
function inspectError(label: string, err: SzError): void {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  ${label}`);
  console.log("=".repeat(70));
  console.log(`  Class name:    ${err.constructor.name}`);
  console.log(`  Message:       ${err.message.slice(0, 120)}`);
  console.log(`  szCode:        ${err.szCode}`);
  console.log(`  code:          ${err.code}`);
  console.log(`  component:     ${err.component}`);
  console.log(`  category:      ${err.category}`);
  console.log(`  severity:      ${err.severity}`);

  console.log("\n  instanceof chain:");
  console.log(`    Error:                      ${err instanceof Error}`);
  console.log(`    SzError:                    ${err instanceof SzError}`);
  console.log(`    SzBadInputError:            ${err instanceof SzBadInputError}`);
  console.log(`    SzNotFoundError:            ${err instanceof SzNotFoundError}`);
  console.log(`    SzUnknownDataSourceError:   ${err instanceof SzUnknownDataSourceError}`);
  console.log(`    SzRetryableError:           ${err instanceof SzRetryableError}`);
  console.log(`    SzUnrecoverableError:       ${err instanceof SzUnrecoverableError}`);

  console.log("\n  Helper methods:");
  console.log(`    isRetryable():       ${err.isRetryable()}`);
  console.log(`    isUnrecoverable():   ${err.isUnrecoverable()}`);
  console.log(`    isBadInput():        ${err.isBadInput()}`);
  console.log(`    isDatabase():        ${err.isDatabase()}`);
  console.log(`    isLicense():         ${err.isLicense()}`);
  console.log(`    isConfiguration():   ${err.isConfiguration()}`);
  console.log(`    isInitialization():  ${err.isInitialization()}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const { env, cleanup } = initSnippetEnvironment("error-inspection", ["CUSTOMERS"]);

try {
  const engine = env.getEngine();

  // --- 1. SzNotFoundError: getRecord for a non-existent record -------------
  console.log("\n--- Triggering SzNotFoundError ---");
  try {
    engine.getRecord("CUSTOMERS", "NO_SUCH_RECORD", SzFlags.NO_FLAGS);
  } catch (e) {
    if (e instanceof SzError) {
      inspectError("SzNotFoundError (non-existent record)", e);
    } else {
      throw e;
    }
  }

  // --- 2. SzUnknownDataSourceError: addRecord with bad data source ---------
  console.log("\n--- Triggering SzUnknownDataSourceError ---");
  try {
    engine.addRecord(
      "NO_SUCH_DATASOURCE",
      "1",
      JSON.stringify({ NAME_FULL: "Jane Doe" }),
      SzFlags.NO_FLAGS,
    );
  } catch (e) {
    if (e instanceof SzError) {
      inspectError("SzUnknownDataSourceError (bad data source)", e);
    } else {
      throw e;
    }
  }

  // --- 3. SzBadInputError: addRecord with invalid JSON ---------------------
  console.log("\n--- Triggering SzBadInputError ---");
  try {
    engine.addRecord("CUSTOMERS", "BAD_JSON", "{{not valid json!!", SzFlags.NO_FLAGS);
  } catch (e) {
    if (e instanceof SzError) {
      inspectError("SzBadInputError (invalid JSON)", e);
    } else {
      throw e;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("  All error inspections complete.");
  console.log("=".repeat(70) + "\n");
} finally {
  cleanup();
}
