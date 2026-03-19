/**
 * Redo Worker
 *
 * Worker thread that creates its own SzEnvironment and processes redo records
 * received from the main thread via parentPort messages.
 *
 * Messages received: { type: "redo", record: string } | { type: "done" }
 * Messages sent:     { type: "processed" } | { type: "finished", count: number }
 */

import { parentPort, workerData } from "node:worker_threads";

if (!parentPort) {
  throw new Error("This file must be run as a worker thread.");
}

// Dynamic import to work around ESM/worker bundling constraints
const sdkModule = await import("@senzing/sdk");
const sdk = (sdkModule as any).default ?? sdkModule;
const { SzEnvironment, SzFlags } = sdk;

const { settings, workerId } = workerData as {
  settings: string;
  workerId: number;
};

const env = new SzEnvironment(`redo-worker-${workerId}`, settings, false);
const engine = env.getEngine();
let processed = 0;

parentPort.on("message", (msg: { type: string; record?: string }) => {
  if (msg.type === "redo" && msg.record) {
    engine.processRedoRecord(msg.record, SzFlags.NO_FLAGS);
    processed++;
    parentPort!.postMessage({ type: "processed" });
  } else if (msg.type === "done") {
    env.destroy();
    parentPort!.postMessage({ type: "finished", count: processed });
  }
});
