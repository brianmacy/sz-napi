/**
 * Diagnostic interface — repository monitoring and maintenance.
 *
 * Implemented by all Senzing SDK transports (native, tRPC, Electron).
 */
export interface SzDiagnostic {
  checkRepositoryPerformance(secondsToRun: number): Promise<any>;
  getFeature(featureId: number): Promise<any>;
  getRepositoryInfo(): Promise<any>;
  purgeRepository(): Promise<void>;
}
