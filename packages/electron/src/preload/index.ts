/**
 * Preload script — exposes the Senzing SDK as `window.senzing`.
 *
 * All args are positional, matching the native SDK signatures.
 * Uses a single generic "sz:call" IPC channel for all method dispatch.
 * String results that look like JSON are automatically parsed.
 *
 * Note: contextBridge.exposeInMainWorld cannot clone Proxy objects,
 * so we build a plain object with explicit function properties.
 */
import { contextBridge, ipcRenderer } from "electron";

/** Methods for each service — used to build the API object. */
const SERVICE_METHODS: Record<string, string[]> = {
  engine: [
    "primeEngine", "getStats",
    "addRecord", "deleteRecord", "getRecord", "getRecordPreview",
    "reevaluateRecord", "reevaluateEntity",
    "getEntityById", "getEntityByRecord", "searchByAttributes",
    "whySearch", "whyEntities", "whyRecords", "whyRecordInEntity",
    "howEntity", "getVirtualEntity",
    "findInterestingEntitiesById", "findInterestingEntitiesByRecord",
    "findPath", "findNetwork",
    "getRedoRecord", "countRedoRecords", "processRedoRecord",
    "exportJsonEntityReport", "exportCsvEntityReport",
  ],
  product: ["getVersion", "getLicense"],
  configManager: [
    "createConfig", "createConfigFromId", "createConfigFromDefinition",
    "getConfigRegistry", "getDefaultConfigId",
    "registerConfig", "replaceDefaultConfigId",
    "setDefaultConfig", "setDefaultConfigId",
  ],
  diagnostic: [
    "checkRepositoryPerformance", "getFeature",
    "getRepositoryInfo", "purgeRepository",
  ],
  lifecycle: [
    "initialize", "destroy", "reinitialize", "getActiveConfigId",
  ],
};

function tryParseJson(val: unknown): unknown {
  if (typeof val === "string" && val.length > 0 && (val[0] === "{" || val[0] === "[")) {
    try { return JSON.parse(val); } catch { /* return as-is */ }
  }
  return val;
}

function makeMethod(service: string, method: string) {
  return async (...args: any[]) => {
    const envelope = await ipcRenderer.invoke("sz:call", service, method, args);
    if (envelope.__szError) {
      const err = new Error(envelope.message) as any;
      err.name = envelope.className;
      err.szCode = envelope.szCode;
      err.category = envelope.category;
      err.severity = envelope.severity;
      throw err;
    }
    return tryParseJson(envelope.result);
  };
}

// Build the API object with plain function properties
const api: Record<string, any> = {
  flags: {},
};

for (const [service, methods] of Object.entries(SERVICE_METHODS)) {
  api[service] = {};
  for (const method of methods) {
    api[service][method] = makeMethod(service, method);
  }
}

// Hoist lifecycle methods to top level
api.initialize = api.lifecycle.initialize;
api.destroy = api.lifecycle.destroy;

// Load flags synchronously from main process
try {
  const flagEntries = ipcRenderer.sendSync("sz:meta:getFlagsSync") as Record<string, string>;
  for (const [name, val] of Object.entries(flagEntries)) {
    api.flags[name] = BigInt(val);
  }
  Object.freeze(api.flags);
} catch {
  // Flags will be empty if main process handler not ready yet
}

contextBridge.exposeInMainWorld("senzing", api);
