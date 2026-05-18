/**
 * Product information interface — version and license details.
 *
 * Implemented by all Senzing SDK transports (native, tRPC, Electron).
 */
export interface SzProduct {
  getVersion(): Promise<string>;
  getLicense(): Promise<string>;
}
