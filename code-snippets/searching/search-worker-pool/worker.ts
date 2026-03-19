/**
 * Search Worker
 *
 * Runs in a worker thread. Creates its own SzEnvironment, listens for
 * "search" messages containing attributes, calls searchByAttributes,
 * and posts results back to the main thread. Handles "shutdown" to
 * cleanly destroy the environment.
 *
 * Used by: search-worker-pool/index.ts
 */

import { parentPort, workerData } from "node:worker_threads";

if (!parentPort) {
  throw new Error("This file must be run as a worker thread.");
}

// Dynamic import to load the native module in worker context.
// CJS module exports are under .default when using dynamic import().
const sdkModule = await import("@senzing/sdk");
const sdk = (sdkModule as any).default ?? sdkModule;
const { SzEnvironment, SzFlags } = sdk;

const workerId: number = workerData.workerId;
const settings: string = workerData.settings;

const env = new SzEnvironment(`search-worker-${workerId}`, settings, false);
const engine = env.getEngine();

console.log(`[worker-${workerId}] Environment initialized.`);
parentPort.postMessage({ type: "ready", workerId });

parentPort.on("message", (msg: { type: string; [key: string]: unknown }) => {
  switch (msg.type) {
    case "search": {
      try {
        const result = engine.searchByAttributes(
          msg.attributes as string,
          undefined,
          SzFlags.SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS,
        );
        parentPort!.postMessage({
          type: "result",
          workerId,
          queryId: msg.queryId,
          success: true,
          data: result,
        });
      } catch (e) {
        parentPort!.postMessage({
          type: "result",
          workerId,
          queryId: msg.queryId,
          success: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      break;
    }

    case "shutdown": {
      console.log(`[worker-${workerId}] Shutting down...`);
      env.destroy();
      console.log(`[worker-${workerId}] Environment destroyed.`);
      process.exit(0);
    }
  }
});
