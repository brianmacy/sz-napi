/**
 * Configuration manager interface — create, register, and activate configs.
 *
 * Implemented by all Senzing SDK transports (native, tRPC, Electron).
 */
export interface SzConfigManager {
  createConfig(): Promise<any>;
  createConfigFromId(configId: number): Promise<any>;
  createConfigFromDefinition(configDefinition: string): Promise<any>;
  getConfigRegistry(): Promise<any>;
  getDefaultConfigId(): Promise<number>;
  registerConfig(configDefinition: string, configComment?: string | null): Promise<number>;
  replaceDefaultConfigId(currentDefaultConfigId: number, newDefaultConfigId: number): Promise<void>;
  setDefaultConfig(configDefinition: string, configComment?: string | null): Promise<number>;
  setDefaultConfigId(configId: number): Promise<void>;
}
