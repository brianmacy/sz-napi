/**
 * Retry with Exponential Backoff Snippet
 *
 * Demonstrates a retry pattern for transient/retryable Senzing errors.
 * Non-retryable errors (e.g. SzNotFoundError) propagate immediately.
 *
 * Run: npx tsx index.ts
 */

import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";
import {
  SzError,
  SzRetryableError,
  SzDatabaseTransientError,
  SzNotFoundError,
  SzFlags,
} from "@senzing/sdk";

/**
 * Executes `fn` with exponential backoff retry for retryable errors.
 *
 * If `fn` throws an {@link SzRetryableError}, the call is retried up to
 * `maxRetries` times with exponentially increasing delays. All other errors
 * propagate immediately.
 *
 * @param fn           The operation to attempt.
 * @param maxRetries   Maximum number of attempts (default 3).
 * @param baseDelayMs  Base delay in milliseconds before the first retry (default 100).
 * @returns The return value of `fn` on success.
 */
function withRetry<T>(fn: () => T, maxRetries = 3, baseDelayMs = 100): T {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return fn();
    } catch (e) {
      if (e instanceof SzRetryableError && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`  Retryable error (attempt ${attempt}/${maxRetries}), waiting ${delay}ms...`);
        // Synchronous delay for simplicity
        const start = Date.now();
        while (Date.now() - start < delay) { /* busy wait */ }
      } else {
        throw e;
      }
    }
  }
  throw new Error("unreachable");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const { env, cleanup } = initSnippetEnvironment("retry-with-backoff", ["CUSTOMERS"]);

try {
  const engine = env.getEngine();

  // --- 1. Successful operation through withRetry ---------------------------
  console.log("\n--- Using withRetry for a successful addRecord ---");
  const record = JSON.stringify({
    NAME_FULL: "Robert Smith",
    ADDR_FULL: "123 Main St, Las Vegas NV 89101",
  });
  const result = withRetry(() => engine.addRecord("CUSTOMERS", "1001", record, SzFlags.NO_FLAGS));
  console.log("  addRecord succeeded on first attempt.");
  if (result) {
    console.log(`  Result: ${result.slice(0, 120)}`);
  }

  // --- 2. Simulated retryable error scenario --------------------------------
  console.log("\n--- Simulating retryable errors with eventual success ---");
  let simulatedAttempt = 0;
  const simulatedResult = withRetry(() => {
    simulatedAttempt++;
    if (simulatedAttempt < 3) {
      // Simulate a transient database error on the first two attempts
      const err = new SzDatabaseTransientError(
        `Simulated transient error on attempt ${simulatedAttempt}`,
      );
      throw err;
    }
    return `Success after ${simulatedAttempt} attempts`;
  }, 5, 50);
  console.log(`  Result: ${simulatedResult}`);

  // --- 3. Non-retryable error is NOT retried --------------------------------
  console.log("\n--- Demonstrating non-retryable error (SzNotFoundError) ---");
  try {
    withRetry(() => {
      engine.getRecord("CUSTOMERS", "DOES_NOT_EXIST", SzFlags.NO_FLAGS);
    });
  } catch (e) {
    if (e instanceof SzError) {
      console.log(`  Caught immediately (not retried): ${e.constructor.name}`);
      console.log(`  isBadInput():   ${e.isBadInput()}`);
      console.log(`  isRetryable():  ${e.isRetryable()}`);
      console.log(`  Message:        ${e.message.slice(0, 120)}`);
    } else {
      throw e;
    }
  }

  // --- 4. Retryable error that exhausts all retries -------------------------
  console.log("\n--- Demonstrating retry exhaustion ---");
  try {
    withRetry(() => {
      throw new SzDatabaseTransientError("Persistent transient failure");
    }, 3, 50);
  } catch (e) {
    if (e instanceof SzRetryableError) {
      console.log(`  All retries exhausted. Final error: ${e.constructor.name}`);
      console.log(`  isRetryable():  ${e.isRetryable()}`);
      console.log(`  Message:        ${e.message}`);
    } else {
      throw e;
    }
  }

  console.log("\n--- All retry demonstrations complete. ---\n");
} finally {
  cleanup();
}
