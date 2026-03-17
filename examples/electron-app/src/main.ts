/**
 * Electron Main Process
 *
 * Creates a BrowserWindow and manages the Senzing worker thread lifecycle.
 * IPC handlers relay renderer requests to the worker and return results.
 *
 * On startup:
 *   1. Detects platform (macOS vs Linux) and builds Senzing settings
 *   2. Initializes a SQLite database with the Senzing schema
 *   3. Bootstraps data sources (CUSTOMERS, WATCHLIST, REFERENCE) via a temporary SzEnvironment
 *   4. Spawns a worker thread that owns its own SzEnvironment
 *   5. Creates a BrowserWindow with the preload script
 *
 * Prerequisites:
 *   - Senzing runtime installed (brew install senzingsdk-runtime-unofficial on macOS)
 */

import { app, BrowserWindow, ipcMain } from "electron";
import { Worker } from "node:worker_threads";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import * as https from "node:https";
import * as path from "node:path";

// -- Message types ------------------------------------------------------------

interface ResultMessage {
  type: "result";
  requestType: string;
  requestId: number;
  success: boolean;
  data?: string;
  error?: string;
}

interface ReadyMessage {
  type: "ready";
}

type MainMessage = ResultMessage | ReadyMessage;

// -- Platform detection -------------------------------------------------------

const isMac = process.platform === "darwin";
const senzingBase = isMac
  ? "/opt/homebrew/opt/senzing/runtime/er"
  : "/opt/senzing/er";
const supportPath = isMac
  ? "/opt/homebrew/opt/senzing/runtime/data"
  : "/opt/senzing/data";

// -- Configuration ------------------------------------------------------------

const dbPath = "/tmp/senzing-electron-example.db";
const schemaPath = `${senzingBase}/resources/schema/szcore-schema-sqlite-create.sql`;

const settings = JSON.stringify({
  PIPELINE: {
    CONFIGPATH: `${senzingBase}/resources/templates`,
    RESOURCEPATH: `${senzingBase}/resources`,
    SUPPORTPATH: supportPath,
  },
  SQL: {
    CONNECTION: `sqlite3://na:na@${dbPath}`,
  },
});

// -- State --------------------------------------------------------------------

let worker: Worker | null = null;
let requestIdCounter = 0;
const pendingRequests = new Map<
  number,
  { resolve: (value: ResultMessage) => void }
>();

// -- Worker management --------------------------------------------------------

function sendToWorker(msg: Record<string, unknown>): Promise<ResultMessage> {
  return new Promise((resolve, reject) => {
    if (!worker) {
      reject(new Error("Worker not initialized"));
      return;
    }
    const requestId = ++requestIdCounter;
    pendingRequests.set(requestId, { resolve });
    worker.postMessage({ ...msg, requestId });
  });
}

function startWorker(): Promise<void> {
  return new Promise((resolve, reject) => {
    const workerPath = path.join(__dirname, "worker.js");
    worker = new Worker(workerPath, {
      workerData: { settings },
    });

    const readyHandler = (msg: MainMessage) => {
      if (msg.type === "ready") {
        worker!.off("message", readyHandler);
        console.log("[main] Worker is ready.");
        resolve();
      }
    };

    worker.on("message", (msg: MainMessage) => {
      if (msg.type === "result") {
        const pending = pendingRequests.get(msg.requestId);
        if (pending) {
          pendingRequests.delete(msg.requestId);
          pending.resolve(msg);
        }
      }
    });

    worker.on("message", readyHandler);

    worker.on("error", (err) => {
      console.error("[main] Worker error:", err);
      reject(err);
    });

    worker.on("exit", (code) => {
      console.log(`[main] Worker exited with code ${code}.`);
      worker = null;
    });
  });
}

// -- Database bootstrap -------------------------------------------------------

async function bootstrapDatabase(): Promise<void> {
  // Initialize SQLite database with schema
  if (existsSync(dbPath)) unlinkSync(dbPath);
  execSync(`sqlite3 ${dbPath} < ${schemaPath}`);

  // Bootstrap data sources using a temporary SzEnvironment
  // CJS module exports are under .default when using dynamic import().
  const sdkModule = await import("@senzing/sdk");
  const sdk = (sdkModule as any).default ?? sdkModule;
  const { SzEnvironment } = sdk;

  const configtoolModule = await import("@senzing/configtool");
  const configtool = (configtoolModule as any).default ?? configtoolModule;
  const { addDataSource } = configtool;

  const setupEnv = new SzEnvironment("electron-setup", settings, false);
  try {
    const configMgr = setupEnv.getConfigManager();
    let configJson = configMgr.createConfig();
    configJson = addDataSource(configJson, { code: "CUSTOMERS" });
    configJson = addDataSource(configJson, { code: "WATCHLIST" });
    configJson = addDataSource(configJson, { code: "REFERENCE" });
    const configId = configMgr.setDefaultConfig(
      configJson,
      "Electron example config with CUSTOMERS, WATCHLIST, and REFERENCE"
    );
    setupEnv.reinitialize(configId);
  } finally {
    setupEnv.destroy();
  }

  console.log("[main] Database bootstrapped with CUSTOMERS, WATCHLIST, and REFERENCE.");
}

// -- IPC handlers -------------------------------------------------------------

function registerIpcHandlers(): void {
  ipcMain.handle("senzing:getVersion", async () => {
    const result = await sendToWorker({ type: "get-version" });
    if (result.success) {
      return JSON.parse(result.data!);
    }
    throw new Error(result.error);
  });

  ipcMain.handle(
    "senzing:addRecord",
    async (
      _event,
      dataSourceCode: string,
      recordId: string,
      recordDefinition: string
    ) => {
      const result = await sendToWorker({
        type: "add-record",
        dataSourceCode,
        recordId,
        recordDefinition,
      });
      if (result.success) {
        return result.data ? JSON.parse(result.data) : null;
      }
      throw new Error(result.error);
    }
  );

  ipcMain.handle(
    "senzing:searchByAttributes",
    async (_event, attributes: string) => {
      const result = await sendToWorker({
        type: "search",
        attributes,
      });
      if (result.success) {
        return JSON.parse(result.data!);
      }
      throw new Error(result.error);
    }
  );
}

// -- Truthset loading ---------------------------------------------------------

const TRUTHSET_URLS = [
  "https://raw.githubusercontent.com/senzing/truth-sets/refs/heads/main/truthsets/demo_v3/customers.json",
  "https://raw.githubusercontent.com/senzing/truth-sets/refs/heads/main/truthsets/demo_v3/watchlist.json",
  "https://raw.githubusercontent.com/senzing/truth-sets/refs/heads/main/truthsets/demo_v3/reference.json",
];

function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadFile(res.headers.location!).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function registerTruthsetHandler(): void {
  ipcMain.handle("senzing:loadTruthset", async () => {
    const startTime = Date.now();

    // Download all three files
    console.log("[main] Downloading truthset files...");
    const bodies = await Promise.all(TRUTHSET_URLS.map(downloadFile));

    // Collect all non-empty lines
    const allLines: string[] = [];
    for (const body of bodies) {
      for (const line of body.split("\n")) {
        const trimmed = line.trim();
        if (trimmed) allLines.push(trimmed);
      }
    }

    const total = allLines.length;
    let loaded = 0;
    let errors = 0;

    console.log(`[main] Loading ${total} truthset records...`);

    const win = BrowserWindow.getAllWindows()[0];

    for (const line of allLines) {
      try {
        const record = JSON.parse(line);
        const dataSourceCode = record.DATA_SOURCE as string;
        const recordId = record.RECORD_ID as string;
        const result = await sendToWorker({
          type: "add-record",
          dataSourceCode,
          recordId,
          recordDefinition: line,
        });
        if (result.success) {
          loaded++;
        } else {
          errors++;
          console.error(`[main] Failed to load record ${dataSourceCode}/${recordId}: ${result.error}`);
        }
      } catch (e) {
        errors++;
      }

      if ((loaded + errors) % 10 === 0 && win) {
        win.webContents.send("senzing:loadProgress", { loaded, total, errors });
      }
    }

    // Send final progress
    if (win) {
      win.webContents.send("senzing:loadProgress", { loaded, total, errors });
    }

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`[main] Truthset loaded: ${loaded} records in ${elapsed.toFixed(1)}s (${errors} errors).`);
    return { loaded, errors, elapsed };
  });
}

// -- Window creation ----------------------------------------------------------

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  return win;
}

// -- App lifecycle ------------------------------------------------------------

app.whenReady().then(async () => {
  try {
    await bootstrapDatabase();
    await startWorker();
    registerIpcHandlers();
    registerTruthsetHandler();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (err) {
    console.error("[main] Startup failed:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (worker) {
    worker.postMessage({ type: "shutdown" });
  }
  // Clean up the SQLite database file
  if (existsSync(dbPath)) unlinkSync(dbPath);
  app.quit();
});
