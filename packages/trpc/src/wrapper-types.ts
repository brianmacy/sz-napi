/**
 * TypeScript declarations for the wrapped Senzing tRPC client.
 *
 * These are aliases to the shared @senzing/types interfaces.
 * Methods match the native @senzing/sdk signatures — positional args, Promise returns.
 */
import type {
  SzEngine,
  SzConfigManager,
  SzDiagnostic,
  SzProduct,
  SzEnvironment,
} from '@senzing/types';

export type SzProductClient = SzProduct;
export type SzEngineClient = SzEngine;
export type SzConfigManagerClient = SzConfigManager;
export type SzDiagnosticClient = SzDiagnostic;
export type SzEnvironmentClient = SzEnvironment;

export interface SzTrpcClient {
  product: SzProductClient;
  engine: SzEngineClient;
  configManager: SzConfigManagerClient;
  diagnostic: SzDiagnosticClient;
  environment: SzEnvironmentClient;
}
