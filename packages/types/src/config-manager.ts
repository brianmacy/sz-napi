/**
 * Configuration manager interface — create, register, and activate configs.
 *
 * Implemented by all Senzing SDK transports (native, tRPC, Electron).
 */
export interface SzConfigManager {
  createConfig(): Promise<string>;
  createConfigFromId(configId: number): Promise<string>;
  createConfigFromDefinition(configDefinition: string): Promise<string>;
  getConfigRegistry(): Promise<string>;
  getDefaultConfigId(): Promise<number>;
  registerConfig(configDefinition: string, configComment?: string | null): Promise<number>;
  replaceDefaultConfigId(currentDefaultConfigId: number, newDefaultConfigId: number): Promise<void>;
  setDefaultConfig(configDefinition: string, configComment?: string | null): Promise<number>;
  setDefaultConfigId(configId: number): Promise<void>;
}
