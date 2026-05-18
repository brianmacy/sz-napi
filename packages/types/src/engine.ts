/**
 * Entity resolution engine interface — records, entities, search, analysis.
 *
 * Implemented by all Senzing SDK transports (native, tRPC, Electron).
 * Methods returning data produce JSON strings that callers parse as needed.
 * Export methods return collected results (not streaming iterators).
 */
import type { RecordKey } from './common.js';

export interface SzEngine {
  // Record Operations
  addRecord(dataSourceCode: string, recordId: string, recordDefinition: string, flags?: bigint): Promise<string>;
  deleteRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<string>;
  getRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<string>;
  getRecordPreview(recordDefinition: string, flags?: bigint): Promise<string>;
  reevaluateRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<string>;
  reevaluateEntity(entityId: number, flags?: bigint): Promise<string>;

  // Entity Retrieval
  getEntityById(entityId: number, flags?: bigint): Promise<string>;
  getEntityByRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<string>;
  searchByAttributes(attributes: string, searchProfile?: string | null, flags?: bigint): Promise<string>;

  // Why/How Analysis
  whySearch(attributes: string, entityId: number, searchProfile?: string | null, flags?: bigint): Promise<string>;
  whyEntities(entityId1: number, entityId2: number, flags?: bigint): Promise<string>;
  whyRecords(dsCode1: string, recId1: string, dsCode2: string, recId2: string, flags?: bigint): Promise<string>;
  whyRecordInEntity(dataSourceCode: string, recordId: string, flags?: bigint): Promise<string>;
  howEntity(entityId: number, flags?: bigint): Promise<string>;
  getVirtualEntity(recordKeys: Array<RecordKey>, flags?: bigint): Promise<string>;

  // Interesting Entities
  findInterestingEntitiesById(entityId: number, flags?: bigint): Promise<string>;
  findInterestingEntitiesByRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<string>;

  // Pathfinding
  findPath(startEntityId: number, endEntityId: number, maxDegrees: number, avoidEntityIds?: number[] | null, requiredDataSources?: string[] | null, flags?: bigint): Promise<string>;
  findNetwork(entityIds: number[], maxDegrees: number, buildOutDegree: number, maxEntities: number, flags?: bigint): Promise<string>;

  // Redo
  getRedoRecord(): Promise<string>;
  countRedoRecords(): Promise<number>;
  processRedoRecord(redoRecord: string, flags?: bigint): Promise<string>;

  // Stats
  primeEngine(): Promise<void>;
  getStats(): Promise<string>;

  // Export (collected results)
  exportJsonEntityReport(flags?: bigint): Promise<string>;
  exportCsvEntityReport(csvColumnList: string, flags?: bigint): Promise<string>;
}
