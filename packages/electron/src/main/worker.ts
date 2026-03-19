/**
 * Worker thread that owns the SzEnvironment and processes SDK calls.
 * All args are positional — passed straight through to the native SDK.
 */
import { parentPort } from "node:worker_threads";
import { SzEnvironment, SzError, mapToSzError } from "@senzing/sdk";
import { serializeSzError } from "../shared/errors";
import { toBigIntFlag } from "../shared/flags";

if (!parentPort) {
  throw new Error("worker.ts must be run as a worker thread");
}

let env: any = null;
const serviceCache: Record<string, any> = {};

/** Lazily resolve services — engine/configManager/etc. can't be obtained until config is registered. */
const services = new Proxy(serviceCache, {
  get(target, prop: string) {
    if (target[prop]) return target[prop];
    if (!env) return undefined;
    switch (prop) {
      case "engine": target[prop] = env.getEngine(); break;
      case "product": target[prop] = env.getProduct(); break;
      case "configManager": target[prop] = env.getConfigManager(); break;
      case "diagnostic": target[prop] = env.getDiagnostic(); break;
    }
    return target[prop];
  },
});

const STREAMING_METHODS = new Set([
  "exportJsonEntityReport",
  "exportCsvEntityReport",
]);

parentPort.on("message", (req: any) => {
  const respond = (resp: any) => {
    parentPort!.postMessage({ id: req.id, ...resp });
  };

  try {
    // --- Lifecycle methods ---
    if (req.service === "lifecycle") {
      switch (req.method) {
        case "initialize": {
          const [settings, opts] = req.args;
          env = new SzEnvironment(
            opts?.moduleName ?? "sz-electron",
            settings,
            opts?.verbose ?? false
          );
          respond({ success: true });
          return;
        }
        case "destroy": {
          env?.destroy();
          env = null;
          Object.keys(serviceCache).forEach((k) => delete serviceCache[k]);
          respond({ success: true });
          return;
        }
        case "reinitialize": {
          env.reinitialize(req.args[0]);
          respond({ success: true, result: undefined });
          return;
        }
        case "getActiveConfigId": {
          const id = env.getActiveConfigId();
          respond({ success: true, result: id });
          return;
        }
      }
    }

    // --- SDK method dispatch ---
    const target = services[req.service];
    if (!target) {
      throw new Error(`Service "${req.service}" not available. Call initialize() first.`);
    }

    const fn = target[req.method];
    if (typeof fn !== "function") {
      throw new Error(`Unknown method: ${req.service}.${req.method}`);
    }

    // Convert bigint flags
    const args = req.args.map((arg: any) =>
      typeof arg === "bigint" ? toBigIntFlag(arg) : arg
    );

    // Streaming methods: collect SzExportIterator
    if (STREAMING_METHODS.has(req.method)) {
      const iter = fn.apply(target, args);
      const chunks: string[] = [];
      for (const chunk of iter) {
        chunks.push(chunk);
      }
      respond({ success: true, result: chunks });
      return;
    }

    const result = fn.apply(target, args);
    respond({ success: true, result });
  } catch (err: any) {
    const szErr = err instanceof SzError ? err : mapToSzError(err);
    respond({ success: false, error: serializeSzError(szErr) });
  }
});

// Signal ready
parentPort.postMessage({ id: "__ready__", success: true });
