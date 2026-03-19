/**
 * Preload script — exposes the Senzing SDK as `window.senzing`.
 *
 * Each service is a Proxy — any method call becomes a generic "sz:call" IPC invoke.
 * All args are positional, matching the native SDK signatures.
 * String results that look like JSON are automatically parsed.
 */
import { contextBridge, ipcRenderer } from "electron";

const SERVICES = ["engine", "product", "configManager", "diagnostic"] as const;

function tryParseJson(val: unknown): unknown {
  if (typeof val === "string" && val.length > 0 && (val[0] === "{" || val[0] === "[")) {
    try { return JSON.parse(val); } catch { /* return as-is */ }
  }
  return val;
}

async function szCall(service: string, method: string, args: any[]): Promise<any> {
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
}

// Build the API object — each service is a Proxy
const api: Record<string, any> = {
  flags: {},
};

for (const service of SERVICES) {
  api[service] = new Proxy({}, {
    get: (_t, method: string) =>
      (...args: any[]) => szCall(service, method, args),
  });
}

// Lifecycle as a Proxy too, plus hoisted to top level
api.lifecycle = new Proxy({}, {
  get: (_t, method: string) =>
    (...args: any[]) => szCall("lifecycle", method, args),
});
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
