/**
 * TypeScript declarations for the `window.senzing` API exposed by the preload script.
 *
 * Service interfaces are aliases to the shared @senzing/types interfaces.
 * All methods use positional args matching the native @senzing/sdk signatures.
 */
import type {
  SzEngine,
  SzConfigManager,
  SzDiagnostic,
  SzProduct,
} from '@senzing/types';

export type SenzingProductAPI = SzProduct;
export type SenzingEngineAPI = SzEngine;
export type SenzingConfigManagerAPI = SzConfigManager;
export type SenzingDiagnosticAPI = SzDiagnostic;

/** Lifecycle methods are Electron-specific (initialize with settings vs constructor). */
export interface SenzingLifecycleAPI {
  initialize(settings: string, opts?: { moduleName?: string; verbose?: boolean }): Promise<void>;
  destroy(): Promise<void>;
  reinitialize(configId: number): Promise<void>;
  getActiveConfigId(): Promise<number>;
}

export interface SenzingAPI {
  product: SenzingProductAPI;
  engine: SenzingEngineAPI;
  configManager: SenzingConfigManagerAPI;
  diagnostic: SenzingDiagnosticAPI;
  lifecycle: SenzingLifecycleAPI;
  flags: Readonly<Record<string, bigint>>;
  initialize(settings: string, opts?: { moduleName?: string; verbose?: boolean }): Promise<void>;
  destroy(): Promise<void>;
}

declare global {
  interface Window {
    senzing: SenzingAPI;
  }
}
