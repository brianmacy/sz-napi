/**
 * TypeScript declarations for the wrapped Senzing tRPC client.
 *
 * Methods match the native @senzing/sdk signatures — positional args, Promise returns.
 */

export interface SzProductClient {
  getVersion(): Promise<any>;
  getLicense(): Promise<any>;
}

export interface SzEngineClient {
  // Record Operations
  addRecord(dataSourceCode: string, recordId: string, recordDefinition: string, flags?: bigint): Promise<any>;
  deleteRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  getRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  getRecordPreview(recordDefinition: string, flags?: bigint): Promise<any>;
  reevaluateRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  reevaluateEntity(entityId: number, flags?: bigint): Promise<any>;

  // Entity Retrieval
  getEntityById(entityId: number, flags?: bigint): Promise<any>;
  getEntityByRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  searchByAttributes(attributes: string, searchProfile?: string | null, flags?: bigint): Promise<any>;

  // Why/How Analysis
  whySearch(attributes: string, entityId: number, searchProfile?: string | null, flags?: bigint): Promise<any>;
  whyEntities(entityId1: number, entityId2: number, flags?: bigint): Promise<any>;
  whyRecords(dsCode1: string, recId1: string, dsCode2: string, recId2: string, flags?: bigint): Promise<any>;
  whyRecordInEntity(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;
  howEntity(entityId: number, flags?: bigint): Promise<any>;
  getVirtualEntity(recordKeys: Array<{ dataSourceCode: string; recordId: string }>, flags?: bigint): Promise<any>;

  // Interesting Entities
  findInterestingEntitiesById(entityId: number, flags?: bigint): Promise<any>;
  findInterestingEntitiesByRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<any>;

  // Pathfinding
  findPath(startEntityId: number, endEntityId: number, maxDegrees: number, avoidEntityIds?: number[] | null, requiredDataSources?: string[] | null, flags?: bigint): Promise<any>;
  findNetwork(entityIds: number[], maxDegrees: number, buildOutDegree: number, maxEntities: number, flags?: bigint): Promise<any>;

  // Redo
  getRedoRecord(): Promise<any>;
  countRedoRecords(): Promise<number>;
  processRedoRecord(redoRecord: string, flags?: bigint): Promise<any>;

  // Stats
  primeEngine(): Promise<void>;
  getStats(): Promise<any>;

  // Export
  exportJsonEntityReport(flags?: bigint): Promise<any>;
  exportCsvEntityReport(csvColumnList: string, flags?: bigint): Promise<string>;
}

export interface SzConfigManagerClient {
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

export interface SzDiagnosticClient {
  checkRepositoryPerformance(secondsToRun: number): Promise<any>;
  getFeature(featureId: number): Promise<any>;
  getRepositoryInfo(): Promise<any>;
  purgeRepository(): Promise<void>;
}

export interface SzEnvironmentClient {
  getActiveConfigId(): Promise<number>;
  reinitialize(configId: number): Promise<void>;
  isDestroyed(): Promise<boolean>;
}

export interface SzTrpcClient {
  product: SzProductClient;
  engine: SzEngineClient;
  configManager: SzConfigManagerClient;
  diagnostic: SzDiagnosticClient;
  environment: SzEnvironmentClient;
}
