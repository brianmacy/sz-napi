/**
 * Redo Worker Pool
 *
 * Demonstrates multi-worker redo processing. The main thread loads records,
 * fetches redo records, and distributes them to a pool of worker threads.
 * Each worker creates its own SzEnvironment and calls processRedoRecord.
 *
 * Usage: npx tsx index.ts
 */

import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const WORKER_COUNT = 2;
const __dirname = dirname(fileURLToPath(import.meta.url));

const { env, settings, cleanup } = initSnippetEnvironment("redo-worker-pool", [
  "CUSTOMERS",
  "WATCHLIST",
]);

try {
  const engine = env.getEngine();

  // -- Load overlapping records to generate redo work -------------------------
  const customerRecords = [
    {
      NAME_FULL: "John Smith",
      ADDR_FULL: "123 Main St",
      SSN_NUMBER: "111-22-3333",
    },
    {
      NAME_FULL: "J Smith",
      ADDR_FULL: "123 Main Street",
      PHONE_NUMBER: "555-1212",
    },
    {
      NAME_FULL: "Johnny Smith",
      SSN_NUMBER: "111-22-3333",
    },
    {
      NAME_FULL: "John A Smith",
      ADDR_FULL: "123 Main St Apt 1",
      PHONE_NUMBER: "555-1212",
    },
  ];

  const watchlistRecords = [
    {
      NAME_FULL: "John Smith",
      SSN_NUMBER: "111-22-3333",
      DATE_OF_BIRTH: "1985-03-15",
    },
    {
      NAME_FULL: "Jane Doe",
      ADDR_FULL: "456 Oak Ave",
      SSN_NUMBER: "444-55-6666",
    },
    {
      NAME_FULL: "J Doe",
      ADDR_FULL: "456 Oak Avenue",
      PHONE_NUMBER: "555-3434",
    },
  ];

  console.log("Loading CUSTOMERS records...");
  for (let i = 0; i < customerRecords.length; i++) {
    engine.addRecord("CUSTOMERS", `C${i + 1}`, JSON.stringify(customerRecords[i]));
  }
  console.log(`  Loaded ${customerRecords.length} CUSTOMERS records.`);

  console.log("Loading WATCHLIST records...");
  for (let i = 0; i < watchlistRecords.length; i++) {
    engine.addRecord("WATCHLIST", `W${i + 1}`, JSON.stringify(watchlistRecords[i]));
  }
  console.log(`  Loaded ${watchlistRecords.length} WATCHLIST records.`);

  // -- Collect all redo records from the main thread --------------------------
  const redoRecords: string[] = [];
  while (true) {
    const count = engine.countRedoRecords();
    if (count === 0) break;
    const redo = engine.getRedoRecord();
    if (!redo) break;
    redoRecords.push(redo);
  }

  console.log(`\nCollected ${redoRecords.length} redo records. Distributing to ${WORKER_COUNT} workers...`);

  if (redoRecords.length === 0) {
    console.log("No redo records to process.");
  } else {
    // -- Spawn workers and distribute redo records ----------------------------
    const workerFile = join(__dirname, "worker.ts");
    const workers: Worker[] = [];
    const workerResults: Promise<number>[] = [];

    for (let i = 0; i < WORKER_COUNT; i++) {
      const worker = new Worker(workerFile, {
        workerData: { settings, workerId: i },
        execArgv: ["--import", "tsx"],
      });
      workers.push(worker);

      workerResults.push(
        new Promise<number>((resolve, reject) => {
          worker.on("message", (msg: { type: string; count?: number }) => {
            if (msg.type === "finished") {
              resolve(msg.count ?? 0);
            }
          });
          worker.on("error", reject);
        }),
      );
    }

    // Round-robin distribute redo records to workers
    for (let i = 0; i < redoRecords.length; i++) {
      const workerIdx = i % WORKER_COUNT;
      workers[workerIdx].postMessage({ type: "redo", record: redoRecords[i] });
    }

    // Signal workers to finish
    for (const worker of workers) {
      worker.postMessage({ type: "done" });
    }

    // Wait for all workers to complete
    const counts = await Promise.all(workerResults);
    const totalProcessed = counts.reduce((sum, c) => sum + c, 0);

    console.log("\n--- Worker Summary ---");
    for (let i = 0; i < counts.length; i++) {
      console.log(`  Worker ${i}: processed ${counts[i]} redo records`);
    }
    console.log(`  Total processed: ${totalProcessed}`);
  }

  console.log("\nDone.");
} finally {
  cleanup();
}
