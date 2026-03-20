import type {
  SzEngine,
  SzConfigManager,
  SzDiagnostic,
  SzProduct,
  SzEnvironment,
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

/** Wraps a native SzEngine with async parsed-JSON interface. */
export declare class SzEngineNative implements SzEngine {
  constructor(engine: SzEngineRaw);
  addRecord(dataSourceCode: string, recordId: string, recordDefinition: string, flags?: bigint): Promise<any>;
  deleteRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  getRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  getRecordPreview(recordDefinition: string, flags?: bigint): Promise<any>;
  reevaluateRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  reevaluateEntity(entityId: number, flags?: bigint): Promise<any>;
  getEntityById(entityId: number, flags?: bigint): Promise<any>;
  getEntityByRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  searchByAttributes(attributes: string, searchProfile?: string | null, flags?: bigint): Promise<any>;
  whySearch(attributes: string, entityId: number, searchProfile?: string | null, flags?: bigint): Promise<any>;
  whyEntities(entityId1: number, entityId2: number, flags?: bigint): Promise<any>;
  whyRecords(dsCode1: string, recId1: string, dsCode2: string, recId2: string, flags?: bigint): Promise<any>;
  whyRecordInEntity(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  howEntity(entityId: number, flags?: bigint): Promise<any>;
  getVirtualEntity(recordKeys: Array<RecordKey>, flags?: bigint): Promise<any>;
  findInterestingEntitiesById(entityId: number, flags?: bigint): Promise<any>;
  findInterestingEntitiesByRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  findPath(startEntityId: number, endEntityId: number, maxDegrees: number, avoidEntityIds?: number[] | null, requiredDataSources?: string[] | null, flags?: bigint): Promise<any>;
  findNetwork(entityIds: number[], maxDegrees: number, buildOutDegree: number, maxEntities: number, flags?: bigint): Promise<any>;
  getRedoRecord(): Promise<any>;
  countRedoRecords(): Promise<number>;
  processRedoRecord(redoRecord: string, flags?: bigint): Promise<any>;
  primeEngine(): Promise<void>;
  getStats(): Promise<any>;
  exportJsonEntityReport(flags?: bigint): Promise<any>;
  exportCsvEntityReport(csvColumnList: string, flags?: bigint): Promise<string>;
}

/** Wraps a native SzConfigManager with async parsed-JSON interface. */
export declare class SzConfigManagerNative implements SzConfigManager {
  constructor(configManager: SzConfigManagerRaw);
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

/** Wraps a native SzDiagnostic with async parsed-JSON interface. */
export declare class SzDiagnosticNative implements SzDiagnostic {
  constructor(diagnostic: SzDiagnosticRaw);
  checkRepositoryPerformance(secondsToRun: number): Promise<any>;
  getFeature(featureId: number): Promise<any>;
  getRepositoryInfo(): Promise<any>;
  purgeRepository(): Promise<void>;
}

/** Wraps a native SzProduct with async parsed-JSON interface. */
export declare class SzProductNative implements SzProduct {
  constructor(product: SzProductRaw);
  getVersion(): Promise<any>;
  getLicense(): Promise<any>;
}

/** Wraps a native SzEnvironment with async interface. */
export declare class SzEnvironmentNative implements SzEnvironment {
  constructor(environment: SzEnvironmentRaw);
  destroy(): Promise<void>;
  reinitialize(configId: number): Promise<void>;
  getActiveConfigId(): Promise<number>;
  isDestroyed(): Promise<boolean>;
}
