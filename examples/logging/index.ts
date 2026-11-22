/**
 * Logging Example
 *
 * Demonstrates Senzing native logging (SzLogging) from Node.js:
 * - Counting log records per module and level with a registered callback
 * - Toggling verbosity at runtime: the default output is a callback whose level is changed with
 *   setDefaultLogLevel (safe at any time, on every Senzing version)
 * - The Senzing 4.5.0 usage rule: set up logging before the engine is initialized and
 *   unregister after destroy()
 *
 * Records are delivered asynchronously on the JS thread, so the example waits for the queue to
 * drain before reading what the callbacks received.
 *
 * Prerequisites:
 *   - Senzing runtime 4.5.0 or later installed (brew install --cask senzingsdk on macOS)
 */

import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { SzEnvironment, SzLogLevel, type SzLogRecord } from "@senzing/sdk";

// -- Platform detection -------------------------------------------------------
const isMac = process.platform === "darwin";
const senzingBase = isMac ? "/opt/homebrew/opt/senzing/er" : "/opt/senzing/er";
const supportPath = isMac ? "/opt/homebrew/opt/senzing/data" : "/opt/senzing/data";

// -- Configuration ------------------------------------------------------------
const dbPath = `/tmp/senzing-example-logging-${process.pid}.db`;
const schemaPath = `${senzingBase}/resources/schema/szcore-schema-sqlite-create.sql`;
const settings = JSON.stringify({
  PIPELINE: {
    CONFIGPATH: `${senzingBase}/resources/templates`,
    RESOURCEPATH: `${senzingBase}/resources`,
    SUPPORTPATH: supportPath,
  },
  SQL: { CONNECTION: `sqlite3://na:na@${dbPath}` },
});

if (existsSync(dbPath)) unlinkSync(dbPath);
execSync(`sqlite3 "${dbPath}" < "${schemaPath}"`);

const env = new SzEnvironment("logging-example", settings, false);
const logging = env.getLogging();

// -- Logging setup: before the engine is initialized (Senzing 4.5.0 rule) -------
// 1. Module statistics: every record at TRACE and above, counted per module and level.
const stats = new Map<string, number>();
const registration = logging.registerCallback(SzLogLevel.Trace, (record: SzLogRecord) => {
  const key = `${record.module}\t${record.level}`;
  stats.set(key, (stats.get(key) ?? 0) + 1);
});

// 2. The default output is a callback; setDefaultLogLevel controls what it receives.
let defaultDelivered = 0;
logging.setDefaultCallback(SzLogLevel.Error, () => {
  defaultDelivered += 1;
});

/** Lets the records queued so far reach the callbacks. */
async function drain(): Promise<void> {
  await sleep(100);
}

try {
  const configManager = env.getConfigManager();
  configManager.setDefaultConfig(configManager.createConfig(), "logging example");
  const engine = env.getEngine();

  const load = (batch: string) => {
    for (let i = 0; i < 10; i++) {
      const record = { NAME_FULL: `Person ${i}`, PHONE_NUMBER: `555-01${String(i).padStart(2, "0")}` };
      engine.addRecord("TEST", `${batch}_${i}`, JSON.stringify(record));
    }
  };

  // -- Quiet phase: the default callback receives ERROR and above only ----------
  await drain();
  defaultDelivered = 0;
  load("QUIET");
  await drain();
  const quiet = defaultDelivered;

  // -- Verbose phase: raise the default level while the engine runs -----------
  logging.setDefaultLogLevel(SzLogLevel.Debug);
  defaultDelivered = 0;
  load("VERBOSE");
  await drain();
  const verbose = defaultDelivered;
  logging.setDefaultLogLevel(SzLogLevel.Error);

  console.log(`Default callback: ${quiet} records quiet (ERROR), ${verbose} records verbose (DEBUG)`);
} finally {
  // -- Cleanup: destroy first, then change logging (nothing else is logging now)
  env.destroy();
  registration.unregister();
  logging.setDefaultOutput({ type: "STDERR" }); // replaces the default callback
  if (existsSync(dbPath)) unlinkSync(dbPath);
}

await drain();
console.log(`\n${"MODULE".padEnd(24)} ${"LEVEL".padEnd(8)} ${"COUNT".padStart(6)}`);
for (const [key, count] of [...stats].sort(([a], [b]) => a.localeCompare(b))) {
  const [module, level] = key.split("\t");
  console.log(`${module.padEnd(24)} ${level.padEnd(8)} ${String(count).padStart(6)}`);
}
if (stats.size === 0) {
  throw new Error("expected Senzing to log at least one record");
}
console.log("\nLogging example complete");
