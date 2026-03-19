/**
 * Entity resolution engine interface — records, entities, search, analysis.
 *
 * Implemented by all Senzing SDK transports (native, tRPC, Electron).
 * All methods return Promises with parsed JSON objects (not raw strings).
 * Export methods return collected results (not streaming iterators).
 */
import type { RecordKey } from './common.js';

export interface SzEngine {
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
  getVirtualEntity(recordKeys: Array<RecordKey>, flags?: bigint): Promise<any>;

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

  // Export (collected results)
  exportJsonEntityReport(flags?: bigint): Promise<any>;
  exportCsvEntityReport(csvColumnList: string, flags?: bigint): Promise<string>;
}
