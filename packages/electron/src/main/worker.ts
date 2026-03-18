/**
 * Worker thread that owns the SzEnvironment and processes SDK calls.
 * Accepts both positional args and object args (destructured via METHOD_MAP).
 */
import { parentPort } from "node:worker_threads";
import { SzEnvironment, SzError, mapToSzError } from "@senzing/sdk";
import { METHOD_REGISTRY, METHOD_MAP } from "../shared/channels";
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

const STREAMING_METHODS = new Set(
  METHOD_REGISTRY.filter((d) => d.streaming).map((d) => d.method)
);

/**
 * Unpack args: if a single object arg is passed and the method has named args
 * in the registry, destructure it into positional order. Otherwise pass through.
 */
function unpackArgs(service: string, method: string, args: any[]): any[] {
  if (args.length === 1 && args[0] && typeof args[0] === "object" && !Array.isArray(args[0])) {
    const def = METHOD_MAP.get(`${service}:${method}`);
    if (def && def.args.length > 0) {
      const obj = args[0];
      return def.args.map((name) => obj[name]);
    }
  }
  return args;
}

parentPort.on("message", (req: any) => {
  const respond = (resp: any) => {
    parentPort!.postMessage({ id: req.id, ...resp });
  };

  try {
    // --- Lifecycle methods ---
    if (req.service === "lifecycle") {
      switch (req.method) {
        case "initialize": {
          const unpacked = unpackArgs("lifecycle", "initialize", req.args);
          const [settings, opts] = unpacked;
          env = new SzEnvironment(
            opts?.moduleName ?? "sz-electron",
            settings,
            opts?.verbose ?? false
          );
          // Services are resolved lazily via the Proxy — don't eagerly call getEngine() etc.
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
          const unpacked = unpackArgs("lifecycle", "reinitialize", req.args);
          env.reinitialize(unpacked[0]);
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

    // Unpack object args → positional, then convert bigint flags
    const positionalArgs = unpackArgs(req.service, req.method, req.args);
    const args = positionalArgs.map((arg: any) =>
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
