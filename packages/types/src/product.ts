/**
 * Product information interface — version and license details.
 *
 * Implemented by all Senzing SDK transports (native, tRPC, Electron).
 */
export interface SzProduct {
  getVersion(): Promise<any>;
  getLicense(): Promise<any>;
}
