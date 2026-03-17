/**
 * Senzing Worker Thread
 *
 * Owns an SzEnvironment instance and processes messages from the main
 * process. Each message includes a requestId so the main process can
 * match responses to pending IPC calls.
 *
 * Supported message types:
 *   - get-version: Returns engine version info
 *   - add-record: Adds a record with WITH_INFO flag
 *   - search: Searches by attributes
 *   - shutdown: Destroys the environment and exits
 */

import { parentPort, workerData } from "node:worker_threads";

if (!parentPort) {
  throw new Error("This file must be run as a worker thread.");
}

// Wrap in async IIFE — CJS module cannot use top-level await.
(async () => {
  // CJS module exports are under .default when using dynamic import().
  const sdkModule = await import("@senzing/sdk");
  const sdk = (sdkModule as any).default ?? sdkModule;
  const { SzEnvironment, SzFlags } = sdk;

  const settings: string = workerData.settings;
  const env = new SzEnvironment("electron-worker", settings, false);
  const engine = env.getEngine();
  const product = env.getProduct();

  console.log("[worker] Environment initialized.");
  parentPort!.postMessage({ type: "ready" });

  parentPort!.on("message", (msg: { type: string; requestId: number; [key: string]: unknown }) => {
    const { type, requestId } = msg;

    switch (type) {
      case "get-version": {
        try {
          const version = product.getVersion();
          parentPort!.postMessage({
            type: "result",
            requestType: "get-version",
            requestId,
            success: true,
            data: version,
          });
        } catch (e) {
          parentPort!.postMessage({
            type: "result",
            requestType: "get-version",
            requestId,
            success: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
        break;
      }

      case "add-record": {
        try {
          const info = engine.addRecord(
            msg.dataSourceCode as string,
            msg.recordId as string,
            msg.recordDefinition as string,
            SzFlags.WITH_INFO
          );
          parentPort!.postMessage({
            type: "result",
            requestType: "add-record",
            requestId,
            success: true,
            data: info,
          });
        } catch (e) {
          parentPort!.postMessage({
            type: "result",
            requestType: "add-record",
            requestId,
            success: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
        break;
      }

      case "search": {
        try {
          const result = engine.searchByAttributes(
            msg.attributes as string,
            undefined,
            SzFlags.SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS
          );
          parentPort!.postMessage({
            type: "result",
            requestType: "search",
            requestId,
            success: true,
            data: result,
          });
        } catch (e) {
          parentPort!.postMessage({
            type: "result",
            requestType: "search",
            requestId,
            success: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
        break;
      }

      case "shutdown": {
        console.log("[worker] Shutting down...");
        env.destroy();
        console.log("[worker] Environment destroyed.");
        process.exit(0);
      }
    }
  });
})();
