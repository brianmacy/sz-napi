/**
 * SzElectronEnvironment — Electron IPC bridge with SDK-style service accessors.
 *
 * Mirrors the native SzEnvironment API: access services as properties
 * and call methods with positional args matching the native SDK.
 *
 * Usage in Electron main process:
 *   const sz = new SzElectronEnvironment();
 *   app.whenReady().then(async () => {
 *     sz.setup();
 *     await sz.initialize(settings);
 *
 *     const config = await sz.configManager.createConfig();
 *     const version = await sz.product.getVersion();
 *     await sz.engine.addRecord("CUSTOMERS", "1001", '{"NAME_FULL":"Bob"}');
 *
 *     // ... create window ...
 *   });
 *   app.on('before-quit', () => sz.teardown());
 */
import { ipcMain } from "electron";
import { Worker } from "node:worker_threads";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { deserializeSzError } from "../shared/errors";

export interface SzElectronEnvironmentOptions {
  workerPath?: string;
  timeoutMs?: number;
}

/** Service proxy type — any method call returns a Promise. */
type ServiceProxy = Record<string, (...args: any[]) => Promise<any>>;

export class SzElectronEnvironment {
  private worker: Worker | null = null;
  private pending = new Map<string, { resolve: (value: any) => void; reject: (err: Error) => void }>();
  private readonly timeoutMs: number;
  private workerPath: string;
  private workerReady: Promise<void> | null = null;

  /** Engine service: entity resolution, search, pathfinding, export, etc. */
  readonly engine: ServiceProxy;
  /** Product service: version and license info. */
  readonly product: ServiceProxy;
  /** Config manager service: create, register, activate configs. */
  readonly configManager: ServiceProxy;
  /** Diagnostic service: repository info, performance benchmarks. */
  readonly diagnostic: ServiceProxy;

  constructor(options?: SzElectronEnvironmentOptions) {
    this.workerPath = options?.workerPath ?? path.join(__dirname, "worker.js");
    this.timeoutMs = options?.timeoutMs ?? 60000;

    // Create service proxies
    this.engine = this.createServiceProxy("engine");
    this.product = this.createServiceProxy("product");
    this.configManager = this.createServiceProxy("configManager");
    this.diagnostic = this.createServiceProxy("diagnostic");
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
   * Initialize the SDK worker and Senzing environment.
   */
  async initialize(settings: string, opts?: { moduleName?: string; verbose?: boolean }) {
    const result = await this.callWorker("lifecycle", "initialize", [settings, opts]);
    if (result.__szError) {
      throw deserializeSzError(result);
    }
  }

  /**
   * Get the active config ID.
   */
  async getActiveConfigId(): Promise<number> {
    return this.callService("lifecycle", "getActiveConfigId");
  }

  /**
   * Reinitialize the SDK with a new config.
   */
  async reinitialize(configId: number): Promise<void> {
    await this.callService("lifecycle", "reinitialize", configId);
  }

  /**
   * Remove IPC handlers, destroy the SDK, and terminate the worker.
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

  private createServiceProxy(service: string): ServiceProxy {
    return new Proxy({} as ServiceProxy, {
      get: (_target, method: string) => {
        return (...args: any[]) => this.callService(service, method, ...args);
      },
    });
  }

  private async callService(service: string, method: string, ...args: any[]): Promise<any> {
    const result = await this.callWorker(service, method, args);
    if (result.__szError) {
      throw deserializeSzError(result);
    }
    return result.result;
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
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Worker call timed out after ${this.timeoutMs}ms: ${service}.${method}`));
      }, this.timeoutMs);
      this.pending.set(id, {
        resolve: (value: any) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject,
      });
      this.worker!.postMessage({ id, service, method, args });
    });
  }
}
