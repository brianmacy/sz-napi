/**
 * log-callback: Receive Senzing log messages in your own code.
 *
 * Key Senzing SDK concepts demonstrated:
 * - Getting the logging interface with env.getLogging()
 * - Registering a callback with a minimum level and a format
 * - Records arrive asynchronously on the JS thread (after the engine call that logged them)
 * - Senzing 4.5.0 rule: register before the engine is initialized, unregister after destroy
 *
 * Usage: npx tsx index.ts
 */

import { SzLogFormat, SzLogLevel, type SzLogRecord } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

// Step 1: Get a Senzing environment (no data sources yet, so the engine is not initialized)
const { env, cleanup } = initSnippetEnvironment("log-callback");

// Step 2: Get the logging interface (no native initialization happens here)
const logging = env.getLogging();

// Step 3: Make the callback the only sink, then register it for INFO and above as JSONL.
// Native calls it on the thread that logs; the SDK queues each record without blocking that
// thread and runs this function later on the JS thread.
logging.setDefaultOutput({ type: "NULL" });
const received: SzLogRecord[] = [];
const registration = logging.registerCallback(
  { minLevel: SzLogLevel.Info, format: SzLogFormat.Jsonl },
  (record) => received.push(record),
);

try {
  // Step 4: Use the engine; its initialization and work are logged to the callback
  const configManager = env.getConfigManager();
  configManager.setDefaultConfig(configManager.createConfig(), "log-callback");
  const engine = env.getEngine();
  engine.addRecord("TEST", "1", JSON.stringify({ NAME_FULL: "Robert Smith" }));
} finally {
  // Step 5: Destroy the environment, then unregister (nothing else is logging now)
  cleanup();
  registration.unregister();
  logging.setDefaultOutput({ type: "STDERR" });
}

// Step 6: Let the queued records reach the callback, then show a few
await new Promise((resolve) => setTimeout(resolve, 100));
console.log(`Received ${received.length} log records at INFO and above`);
for (const record of received.slice(0, 3)) {
  console.log(`[${record.level}] ${record.module}: ${record.message}`);
}
if (received.length === 0) {
  throw new Error("expected Senzing to log at least one INFO record");
}
console.log("Log callback snippet complete");
