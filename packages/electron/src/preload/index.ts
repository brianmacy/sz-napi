/**
 * Preload script — exposes the Senzing SDK as `window.senzing`.
 *
 * Methods accept both positional args and object args (matching tRPC schema shapes).
 * String results that look like JSON are automatically parsed.
 */
import { contextBridge, ipcRenderer } from "electron";
import { METHOD_REGISTRY } from "../shared/channels";

function tryParseJson(val: unknown): unknown {
  if (typeof val === "string" && val.length > 0 && (val[0] === "{" || val[0] === "[")) {
    try { return JSON.parse(val); } catch { /* return as-is */ }
  }
  return val;
}

function makeMethod(channel: string) {
  return async (...args: any[]) => {
    const envelope = await ipcRenderer.invoke(channel, ...args);
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

// Build the API object from the method registry
const api: Record<string, any> = {
  flags: {},
};

for (const def of METHOD_REGISTRY) {
  if (!api[def.service]) api[def.service] = {};
  api[def.service][def.method] = makeMethod(def.channel);
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
