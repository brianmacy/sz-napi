/**
 * TypeScript declarations for the `window.senzing` API exposed by the preload script.
 *
 * Methods accept both positional args and a single object arg (matching tRPC schemas).
 */

export interface SenzingProductAPI {
  getLicense(): Promise<any>;
  getVersion(): Promise<any>;
}

export interface SenzingEngineAPI {
  primeEngine(): Promise<void>;
  getStats(): Promise<any>;
  addRecord(input: { dataSourceCode: string; recordId: string; recordDefinition: string; flags?: bigint }): Promise<any>;
  addRecord(dataSourceCode: string, recordId: string, recordDefinition: string, flags?: bigint): Promise<any>;
  deleteRecord(input: { dataSourceCode: string; recordId: string; flags?: bigint }): Promise<any>;
  deleteRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  reevaluateRecord(input: { dataSourceCode: string; recordId: string; flags?: bigint }): Promise<any>;
  reevaluateRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  reevaluateEntity(input: { entityId: number; flags?: bigint }): Promise<any>;
  reevaluateEntity(entityId: number, flags?: bigint): Promise<any>;
  getRecord(input: { dataSourceCode: string; recordId: string; flags?: bigint }): Promise<any>;
  getRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  getRecordPreview(input: { recordDefinition: string; flags?: bigint }): Promise<any>;
  getRecordPreview(recordDefinition: string, flags?: bigint): Promise<any>;
  getEntityById(input: { entityId: number; flags?: bigint }): Promise<any>;
  getEntityById(entityId: number, flags?: bigint): Promise<any>;
  getEntityByRecord(input: { dataSourceCode: string; recordId: string; flags?: bigint }): Promise<any>;
  getEntityByRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  searchByAttributes(input: { attributes: string; searchProfile?: string; flags?: bigint }): Promise<any>;
  searchByAttributes(attributes: string, searchProfile?: string, flags?: bigint): Promise<any>;
  whySearch(input: { attributes: string; entityId: number; searchProfile?: string; flags?: bigint }): Promise<any>;
  whyEntities(input: { entityId1: number; entityId2: number; flags?: bigint }): Promise<any>;
  whyRecords(input: { dsCode1: string; recId1: string; dsCode2: string; recId2: string; flags?: bigint }): Promise<any>;
  whyRecordInEntity(input: { dataSourceCode: string; recordId: string; flags?: bigint }): Promise<any>;
  howEntity(input: { entityId: number; flags?: bigint }): Promise<any>;
  getVirtualEntity(input: { recordKeys: Array<{ dataSourceCode: string; recordId: string }>; flags?: bigint }): Promise<any>;
  findInterestingEntitiesById(input: { entityId: number; flags?: bigint }): Promise<any>;
  findInterestingEntitiesByRecord(input: { dataSourceCode: string; recordId: string; flags?: bigint }): Promise<any>;
  findPath(input: { startEntityId: number; endEntityId: number; maxDegrees: number; avoidEntityIds?: number[]; requiredDataSources?: string[]; flags?: bigint }): Promise<any>;
  findNetwork(input: { entityIds: number[]; maxDegrees: number; buildOutDegree: number; maxEntities: number; flags?: bigint }): Promise<any>;
  getRedoRecord(): Promise<any>;
  countRedoRecords(): Promise<number>;
  processRedoRecord(input: { redoRecord: string; flags?: bigint }): Promise<any>;
  exportJsonEntityReport(input: { flags?: bigint }): Promise<any>;
  exportCsvEntityReport(input: { csvColumnList: string; flags?: bigint }): Promise<string[]>;
}

export interface SenzingConfigManagerAPI {
  createConfig(): Promise<any>;
  createConfigFromId(input: { configId: number }): Promise<any>;
  createConfigFromDefinition(input: { configDefinition: string }): Promise<any>;
  getConfigRegistry(): Promise<any>;
  getDefaultConfigId(): Promise<number>;
  registerConfig(input: { configDefinition: string; configComment?: string }): Promise<number>;
  replaceDefaultConfigId(input: { currentDefaultConfigId: number; newDefaultConfigId: number }): Promise<void>;
  setDefaultConfig(input: { configDefinition: string; configComment?: string }): Promise<number>;
  setDefaultConfigId(input: { configId: number }): Promise<void>;
}

export interface SenzingDiagnosticAPI {
  checkRepositoryPerformance(input: { secondsToRun: number }): Promise<any>;
  getFeature(input: { featureId: number }): Promise<any>;
  getRepositoryInfo(): Promise<any>;
  purgeRepository(): Promise<void>;
}

export interface SenzingLifecycleAPI {
  initialize(settings: string, opts?: { moduleName?: string; verbose?: boolean }): Promise<void>;
  destroy(): Promise<void>;
  reinitialize(input: { configId: number }): Promise<void>;
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
