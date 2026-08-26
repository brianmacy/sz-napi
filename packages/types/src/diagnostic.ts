/**
 * Diagnostic interface — repository monitoring and maintenance.
 *
 * Implemented by all Senzing SDK transports (native, tRPC, Electron).
 */
import type { JsonString } from './common.js';

export interface SzDiagnostic {
  checkRepositoryPerformance(secondsToRun: number): Promise<JsonString>;
  getFeature(featureId: number): Promise<JsonString>;
  getRepositoryInfo(): Promise<JsonString>;
  purgeRepository(): Promise<void>;
}
