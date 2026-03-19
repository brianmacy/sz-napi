/**
 * SzElectronMain — registers IPC handlers and manages the SDK worker thread.
 *
 * Uses a single generic "sz:call" IPC channel. All args are positional.
 *
 * Usage in Electron main process:
 *   const sz = new SzElectronMain();
 *   app.whenReady().then(() => sz.setup());
 *   app.on('before-quit', () => sz.teardown());
 */
import { ipcMain } from "electron";
import { Worker } from "node:worker_threads";
import * as path from "node:path";
import * as crypto from "node:crypto";

export interface SzElectronMainOptions {
  workerPath?: string;
}

export class SzElectronMain {
  private worker: Worker | null = null;
  private pending = new Map<string, { resolve: (value: any) => void }>();
  private workerPath: string;
  private workerReady: Promise<void> | null = null;

  constructor(options?: SzElectronMainOptions) {
    this.workerPath = options?.workerPath ?? path.join(__dirname, "worker.js");
  }

  /**
   * Register IPC handlers. Call once in app.whenReady().
   */
  setup() {
    // Generic dispatch — all SDK calls go through one channel
    ipcMain.handle("sz:call", async (_event, service: string, method: string, args: any[]) => {
      return this.callWorker(service, method, args);
    });

    // Serve SzFlags synchronously for preload bootstrap.
    // BigInt can't be sent via sendSync, so serialize as strings.
    ipcMain.on("sz:meta:getFlagsSync", (event) => {
      try {
        const { SzFlags } = require("@senzing/sdk");
        const entries: Record<string, string> = {};
        for (const [key, val] of Object.entries(SzFlags)) {
          if (typeof val === "bigint") {
            entries[key] = val.toString();
          }
        }
        event.returnValue = entries;
      } catch {
        event.returnValue = {};
      }
    });
  }

  /**
   * Call any SDK method from the main process.
   */
  async call(service: string, method: string, ...args: any[]): Promise<any> {
    const result = await this.callWorker(service, method, args);
    if (result.__szError) {
      throw new Error(result.message ?? `${service}.${method} failed`);
    }
    return result.result;
  }

  /**
   * Initialize the SDK from the main process (before any renderer window).
   */
  async initialize(settings: string, opts?: { moduleName?: string; verbose?: boolean }) {
    const result = await this.callWorker("lifecycle", "initialize", [settings, opts]);
    if (result.__szError) {
      throw new Error(result.message ?? "SDK initialization failed");
    }
  }

  /**
   * Remove IPC handlers and terminate the worker.
   */
  async teardown() {
    ipcMain.removeHandler("sz:call");
    if (this.worker) {
      await this.callWorker("lifecycle", "destroy", []);
      await this.worker.terminate();
      this.worker = null;
      this.workerReady = null;
    }
  }

  private ensureWorker(): Promise<void> {
    if (this.workerReady) return this.workerReady;
    this.workerReady = new Promise((resolve, reject) => {
      this.worker = new Worker(this.workerPath);
      this.worker.on("message", (msg: any) => {
        if (msg.id === "__ready__") {
          resolve();
          return;
        }
        const pending = this.pending.get(msg.id);
        if (!pending) return;
        this.pending.delete(msg.id);
        if (msg.success) {
          pending.resolve({ __szError: false, result: msg.result });
        } else {
          pending.resolve({ __szError: true, ...msg.error });
        }
      });
      this.worker.on("error", (err) => {
        reject(err);
        for (const [, p] of this.pending) {
          p.resolve({
            __szError: true,
            className: "SzError",
            message: err.message,
            szCode: "SZ_UNHANDLED",
            category: "Unrecoverable",
            severity: "Critical",
          });
        }
        this.pending.clear();
      });
    });
    return this.workerReady;
  }

  private async callWorker(service: string, method: string, args: any[]): Promise<any> {
    await this.ensureWorker();
    const id = crypto.randomUUID();
    return new Promise((resolve) => {
      this.pending.set(id, { resolve });
      this.worker!.postMessage({ id, service, method, args });
    });
  }
}
