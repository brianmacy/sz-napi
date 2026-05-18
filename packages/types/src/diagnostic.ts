/**
 * Diagnostic interface — repository monitoring and maintenance.
 *
 * Implemented by all Senzing SDK transports (native, tRPC, Electron).
 */
export interface SzDiagnostic {
  checkRepositoryPerformance(secondsToRun: number): Promise<string>;
  getFeature(featureId: number): Promise<string>;
  getRepositoryInfo(): Promise<string>;
  purgeRepository(): Promise<void>;
}
