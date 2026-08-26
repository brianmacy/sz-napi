/**
 * Product information interface — version and license details.
 *
 * Implemented by all Senzing SDK transports (native, tRPC, Electron).
 */
import type { JsonString } from './common.js';

export interface SzProduct {
  getVersion(): Promise<JsonString>;
  getLicense(): Promise<JsonString>;
}
