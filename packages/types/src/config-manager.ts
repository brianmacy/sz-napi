/**
 * Configuration manager interface — create, register, and activate configs.
 *
 * Implemented by all Senzing SDK transports (native, tRPC, Electron).
 */
import type { JsonString } from './common.js';

export interface SzConfigManager {
  // A config definition is an opaque handle passed back to registerConfig /
  // setDefaultConfig (or edited via @senzing/configtool, which also takes and
  // returns the string form), so these are plain strings, not JsonString.
  createConfig(): Promise<string>;
  createConfigFromId(configId: number): Promise<string>;
  createConfigFromDefinition(configDefinition: string): Promise<string>;
  // The registry is read by the caller (list of configs), so it is a JsonString.
  getConfigRegistry(): Promise<JsonString>;
  getDefaultConfigId(): Promise<number>;
  registerConfig(configDefinition: string, configComment?: string | null): Promise<number>;
  replaceDefaultConfigId(currentDefaultConfigId: number, newDefaultConfigId: number): Promise<void>;
  setDefaultConfig(configDefinition: string, configComment?: string | null): Promise<number>;
  setDefaultConfigId(configId: number): Promise<void>;
}
