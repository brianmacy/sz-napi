import type {
  SzEngine,
  SzConfigManager,
  SzDiagnostic,
  SzProduct,
  SzEnvironment,
  JsonString,
  RecordKey,
} from '@senzing/types';

// Import native types under different names to avoid collision
import type {
  SzEngine as SzEngineRaw,
  SzConfigManager as SzConfigManagerRaw,
  SzDiagnostic as SzDiagnosticRaw,
  SzProduct as SzProductRaw,
  SzEnvironment as SzEnvironmentRaw,
} from '../index';

/** Wraps a native SzEngine with async JSON-string interface. */
export declare class SzEngineNative implements SzEngine {
  constructor(engine: SzEngineRaw);
  addRecord(dataSourceCode: string, recordId: string, recordDefinition: string, flags?: bigint): Promise<JsonString>;
  deleteRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<JsonString>;
  getRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<JsonString>;
  getRecordPreview(recordDefinition: string, flags?: bigint): Promise<JsonString>;
  reevaluateRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<JsonString>;
  reevaluateEntity(entityId: number, flags?: bigint): Promise<JsonString>;
  getEntityById(entityId: number, flags?: bigint): Promise<JsonString>;
  getEntityByRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<JsonString>;
  searchByAttributes(attributes: string, searchProfile?: string | null, flags?: bigint): Promise<JsonString>;
  whySearch(attributes: string, entityId: number, searchProfile?: string | null, flags?: bigint): Promise<JsonString>;
  whyEntities(entityId1: number, entityId2: number, flags?: bigint): Promise<JsonString>;
  whyRecords(dsCode1: string, recId1: string, dsCode2: string, recId2: string, flags?: bigint): Promise<JsonString>;
  whyRecordInEntity(dataSourceCode: string, recordId: string, flags?: bigint): Promise<JsonString>;
  howEntity(entityId: number, flags?: bigint): Promise<JsonString>;
  getVirtualEntity(recordKeys: Array<RecordKey>, flags?: bigint): Promise<JsonString>;
  findInterestingEntitiesById(entityId: number, flags?: bigint): Promise<JsonString>;
  findInterestingEntitiesByRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<JsonString>;
  findPath(startEntityId: number, endEntityId: number, maxDegrees: number, avoidEntityIds?: number[] | null, requiredDataSources?: string[] | null, flags?: bigint): Promise<JsonString>;
  findNetwork(entityIds: number[], maxDegrees: number, buildOutDegree: number, maxEntities: number, flags?: bigint): Promise<JsonString>;
  getRedoRecord(): Promise<string>;
  countRedoRecords(): Promise<number>;
  processRedoRecord(redoRecord: string, flags?: bigint): Promise<JsonString>;
  primeEngine(): Promise<void>;
  getStats(): Promise<JsonString>;
  exportJsonEntityReport(flags?: bigint): Promise<JsonString>;
  exportCsvEntityReport(csvColumnList: string, flags?: bigint): Promise<string>;
}

/** Wraps a native SzConfigManager with async JSON-string interface. */
export declare class SzConfigManagerNative implements SzConfigManager {
  constructor(configManager: SzConfigManagerRaw);
  createConfig(): Promise<string>;
  createConfigFromId(configId: number): Promise<string>;
  createConfigFromDefinition(configDefinition: string): Promise<string>;
  getConfigRegistry(): Promise<JsonString>;
  getDefaultConfigId(): Promise<number>;
  registerConfig(configDefinition: string, configComment?: string | null): Promise<number>;
  replaceDefaultConfigId(currentDefaultConfigId: number, newDefaultConfigId: number): Promise<void>;
  setDefaultConfig(configDefinition: string, configComment?: string | null): Promise<number>;
  setDefaultConfigId(configId: number): Promise<void>;
}

/** Wraps a native SzDiagnostic with async JSON-string interface. */
export declare class SzDiagnosticNative implements SzDiagnostic {
  constructor(diagnostic: SzDiagnosticRaw);
  checkRepositoryPerformance(secondsToRun: number): Promise<JsonString>;
  getFeature(featureId: number): Promise<JsonString>;
  getRepositoryInfo(): Promise<JsonString>;
  purgeRepository(): Promise<void>;
}

/** Wraps a native SzProduct with async JSON-string interface. */
export declare class SzProductNative implements SzProduct {
  constructor(product: SzProductRaw);
  getVersion(): Promise<JsonString>;
  getLicense(): Promise<JsonString>;
}

/** Wraps a native SzEnvironment with async interface. */
export declare class SzEnvironmentNative implements SzEnvironment {
  constructor(environment: SzEnvironmentRaw);
  destroy(): Promise<void>;
  reinitialize(configId: number): Promise<void>;
  getActiveConfigId(): Promise<number>;
  isDestroyed(): Promise<boolean>;
}
