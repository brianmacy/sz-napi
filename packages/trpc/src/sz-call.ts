/**
 * Shared error-wrapping utility for tRPC procedure handlers.
 *
 * Catches Senzing errors and converts them to typed TRPCErrors
 * so clients get meaningful HTTP status codes.
 */
import { toTRPCError } from './errors.js';

/** Wrap a handler so Senzing errors become typed TRPCErrors. */
export function szCall<T>(fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    throw toTRPCError(err);
  }
}
