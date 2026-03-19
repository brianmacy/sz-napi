/**
 * load-worker-pool: Multi-worker record loading using worker_threads.
 *
 * The main thread sets up the environment (config + data sources), then
 * spawns N workers that each create their own SzEnvironment. Records are
 * distributed round-robin across workers. Results are collected and a
 * summary is printed.
 *
 * Usage: npx tsx index.ts
 */

import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const NUM_WORKERS = 4;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerPath = path.join(__dirname, "worker.ts");

// Records to load — varied names/addresses that will partially resolve.
const records = [
  { RECORD_ID: "2001", NAME_FULL: "Robert Smith", DATE_OF_BIRTH: "1985-02-15", ADDR_FULL: "123 Main St, Las Vegas, NV 89101" },
  { RECORD_ID: "2002", NAME_FULL: "Bob J Smith", DATE_OF_BIRTH: "2/15/1985", PHONE_NUMBER: "702-555-1212" },
  { RECORD_ID: "2003", NAME_FULL: "Robert Smith", ADDR_FULL: "123 Main Street, Las Vegas, NV 89101", PHONE_NUMBER: "702-555-1212" },
  { RECORD_ID: "2004", NAME_FULL: "Maria Garcia", DATE_OF_BIRTH: "1990-07-22", ADDR_FULL: "456 Oak Ave, Henderson, NV 89015" },
  { RECORD_ID: "2005", NAME_FULL: "M Garcia", DATE_OF_BIRTH: "7/22/1990", PHONE_NUMBER: "702-555-3434" },
  { RECORD_ID: "2006", NAME_FULL: "Maria T Garcia", ADDR_FULL: "456 Oak Avenue, Henderson, NV 89015", PHONE_NUMBER: "702-555-3434" },
  { RECORD_ID: "2007", NAME_FULL: "James Johnson", DATE_OF_BIRTH: "1978-11-03", ADDR_FULL: "789 Pine Rd, Reno, NV 89501" },
  { RECORD_ID: "2008", NAME_FULL: "Jim Johnson", DATE_OF_BIRTH: "11/3/1978", PHONE_NUMBER: "775-555-6789" },
  { RECORD_ID: "2009", NAME_FULL: "Susan Lee", DATE_OF_BIRTH: "1995-01-30", ADDR_FULL: "321 Elm St, Carson City, NV 89701" },
  { RECORD_ID: "2010", NAME_FULL: "Sue Lee", DATE_OF_BIRTH: "1/30/1995", ADDR_FULL: "321 Elm Street, Carson City, NV 89701" },
  { RECORD_ID: "2011", NAME_FULL: "Robert Smith Jr", ADDR_FULL: "123 Main St, Las Vegas, NV 89101", PHONE_NUMBER: "702-555-1212" },
  { RECORD_ID: "2012", NAME_FULL: "Maria Garcia-Lopez", DATE_OF_BIRTH: "7/22/1990", ADDR_FULL: "456 Oak Ave, Henderson, NV 89015" },
];

interface WorkerResult {
  workerId: number;
  recordId: string;
  affectedEntities: number[];
  error: string | null;
}

async function main() {
  // Main thread creates the environment for config setup, then destroys it
  // before spawning workers (each worker creates its own).
  const { env, settings, cleanup } = initSnippetEnvironment(
    "load-worker-pool",
    ["CUSTOMERS"],
  );

  try {
    // Destroy the main-thread environment so workers can each create their own.
    // The DB and settings persist; cleanup() handles final DB removal.
    env.destroy();

    // Spawn workers.
    const workers: Worker[] = [];
    const readyPromises: Promise<void>[] = [];

    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = new Worker(workerPath, {
        workerData: { settings, workerId: i },
        execArgv: ["--import", "tsx"],
      });
      workers.push(worker);
      readyPromises.push(
        new Promise((resolve) => {
          worker.on("message", function onReady(msg: { type: string }) {
            if (msg.type === "ready") {
              worker.off("message", onReady);
              resolve();
            }
          });
        }),
      );
    }

    console.log(`Spawning ${NUM_WORKERS} workers...`);
    await Promise.all(readyPromises);
    console.log("All workers ready.\n");

    // Distribute records round-robin and collect results.
    let completed = 0;
    const total = records.length;
    const results: WorkerResult[] = [];

    await new Promise<void>((resolve) => {
      for (const worker of workers) {
        worker.on("message", (msg: WorkerResult & { type: string }) => {
          if (msg.type === "result") {
            completed++;
            results.push(msg);
            const status = msg.error ? `ERROR: ${msg.error}` : `entities: [${msg.affectedEntities.join(", ")}]`;
            console.log(
              `[${completed}/${total}] Worker ${msg.workerId} | CUSTOMERS:${msg.recordId} → ${status}`,
            );
            if (completed === total) resolve();
          }
        });
      }

      // Send records round-robin.
      for (let i = 0; i < total; i++) {
        const { RECORD_ID, ...data } = records[i];
        workers[i % NUM_WORKERS].postMessage({
          type: "add-record",
          dataSource: "CUSTOMERS",
          recordId: RECORD_ID,
          recordData: JSON.stringify(data),
        });
      }
    });

    // Shut down workers.
    console.log("\nShutting down workers...");
    const shutdownPromises = workers.map(
      (worker) =>
        new Promise<void>((resolve) => {
          worker.on("message", (msg: { type: string }) => {
            if (msg.type === "shutdown-ack") {
              worker.terminate().then(() => resolve());
            }
          });
          worker.postMessage({ type: "shutdown" });
        }),
    );
    await Promise.all(shutdownPromises);

    // Summary.
    const errors = results.filter((r) => r.error);
    console.log(`\nDone. ${total} records loaded across ${NUM_WORKERS} workers.`);
    if (errors.length > 0) {
      console.log(`${errors.length} errors encountered.`);
    }
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
