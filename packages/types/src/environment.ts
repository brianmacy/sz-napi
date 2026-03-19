/**
 * Environment lifecycle interface — shared across all transports.
 *
 * Does NOT include hub accessors (getEngine, etc.) since those return
 * transport-specific implementations.
 */
export interface SzEnvironment {
  destroy(): Promise<void>;
  reinitialize(configId: number): Promise<void>;
  getActiveConfigId(): Promise<number>;
  isDestroyed(): Promise<boolean>;
}
