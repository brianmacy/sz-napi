/**
 * Convert a flag value to bigint for the SDK.
 * Structured clone handles bigint natively across worker_threads and Electron IPC.
 */
export function toBigIntFlag(value: unknown): bigint | undefined {
  if (value === undefined || value === null) return undefined;
  return typeof value === "number" ? BigInt(value) : value as bigint;
}
