/**
 * Search Worker Pool Snippet
 *
 * Demonstrates a multi-worker search pattern using Node.js worker_threads.
 * The main thread seeds records into the database using its own SzEnvironment,
 * then spawns N workers that each create their own SzEnvironment and handle
 * search queries concurrently.
 *
 * Run: npx tsx index.ts
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { SzFlags } from "@senzing/sdk";
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const WORKER_COUNT = 2;

// -- Set up environment and seed records --------------------------------------
const { env, settings, dbPath, cleanup } = initSnippetEnvironment(
  "search-worker-pool",
  ["CUSTOMERS", "WATCHLIST"],
);

const engine = env.getEngine();

const seedRecords = [
  {
    ds: "CUSTOMERS",
    id: "C1001",
    data: {
      NAME_FULL: "Robert Smith",
      DATE_OF_BIRTH: "1985-02-15",
      ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
      SSN_NUMBER: "111-22-3333",
    },
  },
  {
    ds: "CUSTOMERS",
    id: "C1002",
    data: {
      NAME_FULL: "Bob Smith",
      DATE_OF_BIRTH: "2/15/1985",
      ADDR_FULL: "123 Main Street, Las Vegas, NV 89101",
    },
  },
  {
    ds: "WATCHLIST",
    id: "W2001",
    data: {
      NAME_FULL: "Jane Doe",
      DATE_OF_BIRTH: "1990-07-20",
      ADDR_FULL: "456 Oak Ave, Henderson, NV 89002",
      EMAIL_ADDRESS: "jane.doe@example.com",
    },
  },
  {
    ds: "CUSTOMERS",
    id: "C1003",
    data: {
      NAME_FULL: "Maria Garcia",
      ADDR_FULL: "789 Pine Rd, Reno, NV 89501",
      PHONE_NUMBER: "775-555-9876",
    },
  },
];

console.log("Seeding records from main thread...");
for (const rec of seedRecords) {
  engine.addRecord(rec.ds, rec.id, JSON.stringify(rec.data), SzFlags.NO_FLAGS);
  console.log(`  Added ${rec.ds}/${rec.id}`);
}

// Destroy the main-thread environment before workers start theirs
env.destroy();
console.log("Main-thread environment destroyed.\n");

// -- Spawn workers ------------------------------------------------------------
const workerFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "worker.ts",
);

interface WorkerHandle {
  worker: Worker;
  workerId: number;
}

function spawnWorker(workerId: number): Promise<WorkerHandle> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFile, {
      workerData: { workerId, settings },
    });

    worker.on("error", reject);

    const readyHandler = (msg: { type: string }) => {
      if (msg.type === "ready") {
        worker.off("message", readyHandler);
        resolve({ worker, workerId });
      }
    };
    worker.on("message", readyHandler);
  });
}

function sendSearch(
  handle: WorkerHandle,
  queryId: number,
  attributes: string,
): Promise<{ queryId: number; workerId: number; success: boolean; data?: string; error?: string }> {
  return new Promise((resolve) => {
    const handler = (msg: { type: string; queryId?: number; [key: string]: unknown }) => {
      if (msg.type === "result" && msg.queryId === queryId) {
        handle.worker.off("message", handler);
        resolve(msg as any);
      }
    };
    handle.worker.on("message", handler);
    handle.worker.postMessage({ type: "search", queryId, attributes });
  });
}

function shutdownWorker(handle: WorkerHandle): Promise<number> {
  return new Promise((resolve) => {
    handle.worker.on("exit", resolve);
    handle.worker.postMessage({ type: "shutdown" });
  });
}

// -- Main logic ---------------------------------------------------------------
async function main() {
  console.log(`Spawning ${WORKER_COUNT} workers...`);
  const handles = await Promise.all(
    Array.from({ length: WORKER_COUNT }, (_, i) => spawnWorker(i)),
  );
  console.log("All workers ready.\n");

  // Search queries to distribute across workers
  const queries = [
    { name: "Robert Smith", attrs: JSON.stringify({ NAME_FULL: "Robert Smith" }) },
    { name: "Jane Doe", attrs: JSON.stringify({ NAME_FULL: "Jane Doe", ADDR_FULL: "456 Oak Ave, Henderson, NV 89002" }) },
    { name: "Maria Garcia", attrs: JSON.stringify({ NAME_FULL: "Maria Garcia", PHONE_NUMBER: "775-555-9876" }) },
    { name: "Bob Smith", attrs: JSON.stringify({ NAME_FULL: "Bob Smith", DATE_OF_BIRTH: "1985-02-15" }) },
  ];

  // Distribute queries round-robin across workers
  console.log("Sending search queries to workers...");
  const resultPromises = queries.map((q, i) => {
    const handle = handles[i % handles.length];
    console.log(`  Query ${i} ("${q.name}") -> worker-${handle.workerId}`);
    return sendSearch(handle, i, q.attrs);
  });

  const results = await Promise.all(resultPromises);

  // -- Print summary ----------------------------------------------------------
  console.log("\n--- Search Results Summary ---\n");
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const q = queries[i];
    console.log(`Query ${i}: "${q.name}" (worker-${r.workerId})`);
    if (r.success && r.data) {
      const parsed = JSON.parse(r.data);
      const entities = parsed.RESOLVED_ENTITIES ?? [];
      console.log(`  Matched ${entities.length} entity(ies)`);
      for (const match of entities) {
        const eid = match.ENTITY?.RESOLVED_ENTITY?.ENTITY_ID;
        const matchKey = match.MATCH_INFO?.MATCH_KEY ?? "(none)";
        console.log(`    Entity ${eid} | Match Key: ${matchKey}`);
      }
    } else {
      console.log(`  ERROR: ${r.error}`);
    }
  }

  // -- Shutdown workers -------------------------------------------------------
  console.log("\nShutting down workers...");
  await Promise.all(handles.map(shutdownWorker));
  console.log("All workers exited.");

  cleanup();
}

main().catch((err) => {
  console.error(err);
  cleanup();
  process.exit(1);
});
