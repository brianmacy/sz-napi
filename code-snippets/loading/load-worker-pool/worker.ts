/**
 * Worker thread for load-worker-pool.
 *
 * Each worker creates its own SzEnvironment (the native engine is thread-safe),
 * listens for "add-record" messages, and posts results back to the main thread.
 */

import { parentPort, workerData } from "node:worker_threads";

interface AddRecordMessage {
  type: "add-record";
  dataSource: string;
  recordId: string;
  recordData: string;
}

interface ShutdownMessage {
  type: "shutdown";
}

type WorkerMessage = AddRecordMessage | ShutdownMessage;

async function main() {
  const { settings, workerId } = workerData as {
    settings: string;
    workerId: number;
  };

  // Dynamic import for SDK compatibility with tsx/ESM loaders.
  const sdkModule = await import("@senzing/sdk");
  const sdk = (sdkModule as any).default ?? sdkModule;
  const { SzEnvironment, SzFlags } = sdk;

  const env = new SzEnvironment(`worker-${workerId}`, settings, false);
  const engine = env.getEngine();

  parentPort!.on("message", (msg: WorkerMessage) => {
    if (msg.type === "add-record") {
      try {
        const infoJson = engine.addRecord(
          msg.dataSource,
          msg.recordId,
          msg.recordData,
          SzFlags.WITH_INFO,
        );
        const info = JSON.parse(infoJson);
        const affected = (info.AFFECTED_ENTITIES ?? []).map(
          (e: { ENTITY_ID: number }) => e.ENTITY_ID,
        );
        parentPort!.postMessage({
          type: "result",
          workerId,
          recordId: msg.recordId,
          affectedEntities: affected,
          error: null,
        });
      } catch (err: unknown) {
        parentPort!.postMessage({
          type: "result",
          workerId,
          recordId: msg.recordId,
          affectedEntities: [],
          error: (err as Error).message,
        });
      }
    } else if (msg.type === "shutdown") {
      if (!env.isDestroyed()) env.destroy();
      parentPort!.postMessage({ type: "shutdown-ack", workerId });
    }
  });

  parentPort!.postMessage({ type: "ready", workerId });
}

main().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
