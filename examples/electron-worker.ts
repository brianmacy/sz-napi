/**
 * Electron Worker Thread Pattern
 *
 * Demonstrates how to use @senzing/sdk with Node.js worker_threads
 * to keep the main thread responsive in an Electron application.
 *
 * Architecture:
 *   Main thread  -- sends work messages --> Worker thread
 *   Worker thread -- owns SzEnvironment, processes records
 *   Worker thread -- sends results back --> Main thread
 *
 * Each worker creates its own SzEnvironment. The Senzing engine is
 * thread-safe, so multiple workers can operate concurrently.
 *
 * In an Electron app, the main thread handles the UI while workers
 * handle the heavy entity resolution workload.
 *
 * Prerequisites:
 *   - Senzing runtime installed
 *   - DYLD_LIBRARY_PATH or LD_LIBRARY_PATH set to the Senzing lib directory
 */

import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from "node:worker_threads";

// ---------------------------------------------------------------------------
// Message types exchanged between main and worker threads
// ---------------------------------------------------------------------------

interface AddRecordMessage {
  type: "add-record";
  dataSourceCode: string;
  recordId: string;
  recordDefinition: string;
}

interface SearchMessage {
  type: "search";
  attributes: string;
}

interface ShutdownMessage {
  type: "shutdown";
}

type WorkerMessage = AddRecordMessage | SearchMessage | ShutdownMessage;

interface ResultMessage {
  type: "result";
  requestType: string;
  success: boolean;
  data?: string;
  error?: string;
}

interface ReadyMessage {
  type: "ready";
}

type MainMessage = ResultMessage | ReadyMessage;

// ---------------------------------------------------------------------------
// Worker thread logic
// ---------------------------------------------------------------------------

if (!isMainThread && parentPort) {
  // Worker thread: import SDK and create a dedicated environment.
  // Dynamic import ensures the native module loads in the worker context.
  const { SzEnvironment, SzFlags, SzError } = require("@senzing/sdk");

  const settings: string = workerData.settings;
  const env = new SzEnvironment("electron-worker", settings, false);
  const engine = env.getEngine();

  console.log("[worker] Environment initialized.");
  parentPort.postMessage({ type: "ready" } as ReadyMessage);

  parentPort.on("message", (msg: WorkerMessage) => {
    switch (msg.type) {
      case "add-record": {
        try {
          const info = engine.addRecord(
            msg.dataSourceCode,
            msg.recordId,
            msg.recordDefinition,
            SzFlags.WITH_INFO
          );
          parentPort!.postMessage({
            type: "result",
            requestType: "add-record",
            success: true,
            data: info,
          } as ResultMessage);
        } catch (e) {
          parentPort!.postMessage({
            type: "result",
            requestType: "add-record",
            success: false,
            error: e instanceof Error ? e.message : String(e),
          } as ResultMessage);
        }
        break;
      }

      case "search": {
        try {
          const result = engine.searchByAttributes(
            msg.attributes,
            undefined,
            SzFlags.SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS
          );
          parentPort!.postMessage({
            type: "result",
            requestType: "search",
            success: true,
            data: result,
          } as ResultMessage);
        } catch (e) {
          parentPort!.postMessage({
            type: "result",
            requestType: "search",
            success: false,
            error: e instanceof Error ? e.message : String(e),
          } as ResultMessage);
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
}

// ---------------------------------------------------------------------------
// Main thread logic
// ---------------------------------------------------------------------------

if (isMainThread) {
  const settings = JSON.stringify({
    PIPELINE: {
      CONFIGPATH: "/opt/senzing/er/resources/templates",
      RESOURCEPATH: "/opt/senzing/er/resources",
      SUPPORTPATH: "/opt/senzing/data",
    },
    SQL: {
      CONNECTION: "sqlite3://na:na@/tmp/senzing-worker-example.db",
    },
  });

  // Create a worker using this same file.
  // In an Electron app, you would point to a bundled worker script.
  const worker = new Worker(__filename, {
    workerData: { settings },
  });

  // Helper to send a message and wait for the result
  function sendAndWait(msg: WorkerMessage): Promise<ResultMessage> {
    return new Promise((resolve) => {
      const handler = (response: MainMessage) => {
        if (response.type === "result") {
          worker.off("message", handler);
          resolve(response);
        }
      };
      worker.on("message", handler);
      worker.postMessage(msg);
    });
  }

  // Wait for the worker to be ready
  async function waitForReady(): Promise<void> {
    return new Promise((resolve) => {
      const handler = (msg: MainMessage) => {
        if (msg.type === "ready") {
          worker.off("message", handler);
          resolve();
        }
      };
      worker.on("message", handler);
    });
  }

  async function main() {
    console.log("[main] Waiting for worker to initialize...");
    await waitForReady();
    console.log("[main] Worker is ready.");

    // Add some records via the worker
    const records = [
      {
        dataSourceCode: "CUSTOMERS",
        recordId: "W001",
        data: { NAME_FULL: "Robert Smith", DATE_OF_BIRTH: "1985-02-15" },
      },
      {
        dataSourceCode: "CUSTOMERS",
        recordId: "W002",
        data: { NAME_FULL: "Bob Smith", DATE_OF_BIRTH: "2/15/1985" },
      },
      {
        dataSourceCode: "CUSTOMERS",
        recordId: "W003",
        data: { NAME_FULL: "Jane Doe", EMAIL_ADDRESS: "jane@example.com" },
      },
    ];

    console.log("\n[main] Sending records to worker...");
    for (const rec of records) {
      const result = await sendAndWait({
        type: "add-record",
        dataSourceCode: rec.dataSourceCode,
        recordId: rec.recordId,
        recordDefinition: JSON.stringify(rec.data),
      });

      if (result.success) {
        console.log(`[main] Record ${rec.recordId} added.`);
      } else {
        console.error(`[main] Record ${rec.recordId} failed: ${result.error}`);
      }
    }

    // Search via the worker
    console.log("\n[main] Sending search request to worker...");
    const searchResult = await sendAndWait({
      type: "search",
      attributes: JSON.stringify({ NAME_FULL: "Robert Smith" }),
    });

    if (searchResult.success && searchResult.data) {
      const parsed = JSON.parse(searchResult.data);
      console.log(
        `[main] Search returned ${parsed.RESOLVED_ENTITIES?.length ?? 0} entities`
      );
    } else {
      console.error(`[main] Search failed: ${searchResult.error}`);
    }

    // Shutdown the worker
    console.log("\n[main] Sending shutdown...");
    worker.postMessage({ type: "shutdown" } as ShutdownMessage);

    worker.on("exit", (code) => {
      console.log(`[main] Worker exited with code ${code}.`);
    });
  }

  main().catch(console.error);
}
