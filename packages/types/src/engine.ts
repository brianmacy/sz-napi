/**
 * Entity resolution engine interface — records, entities, search, analysis.
 *
 * Implemented by all Senzing SDK transports (native, tRPC, Electron).
 * Methods returning data produce JSON strings that callers parse as needed.
 * Export methods return collected results (not streaming iterators).
 */
import type { JsonString, RecordKey } from './common.js';

export interface SzEngine {
  // Record Operations
  addRecord(dataSourceCode: string, recordId: string, recordDefinition: string, flags?: bigint): Promise<JsonString>;
  deleteRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<JsonString>;
  getRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<JsonString>;
  getRecordPreview(recordDefinition: string, flags?: bigint): Promise<JsonString>;
  reevaluateRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<JsonString>;
  reevaluateEntity(entityId: number, flags?: bigint): Promise<JsonString>;

  // Entity Retrieval
  getEntityById(entityId: number, flags?: bigint): Promise<JsonString>;
  getEntityByRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<JsonString>;
  searchByAttributes(attributes: string, searchProfile?: string | null, flags?: bigint): Promise<JsonString>;

  // Why/How Analysis
  whySearch(attributes: string, entityId: number, searchProfile?: string | null, flags?: bigint): Promise<JsonString>;
  whyEntities(entityId1: number, entityId2: number, flags?: bigint): Promise<JsonString>;
  whyRecords(dsCode1: string, recId1: string, dsCode2: string, recId2: string, flags?: bigint): Promise<JsonString>;
  whyRecordInEntity(dataSourceCode: string, recordId: string, flags?: bigint): Promise<JsonString>;
  howEntity(entityId: number, flags?: bigint): Promise<JsonString>;
  getVirtualEntity(recordKeys: Array<RecordKey>, flags?: bigint): Promise<JsonString>;

  // Interesting Entities
  findInterestingEntitiesById(entityId: number, flags?: bigint): Promise<JsonString>;
  findInterestingEntitiesByRecord(dataSourceCode: string, recordId: string, flags?: bigint): Promise<JsonString>;

  // Pathfinding
  findPath(startEntityId: number, endEntityId: number, maxDegrees: number, avoidEntityIds?: number[] | null, requiredDataSources?: string[] | null, flags?: bigint): Promise<JsonString>;
  findNetwork(entityIds: number[], maxDegrees: number, buildOutDegree: number, maxEntities: number, flags?: bigint): Promise<JsonString>;

  // Redo
  // A redo record is an opaque token passed straight back to processRedoRecord —
  // not a document to parse — so it is a plain string, not a JsonString.
  getRedoRecord(): Promise<string>;
  countRedoRecords(): Promise<number>;
  processRedoRecord(redoRecord: string, flags?: bigint): Promise<JsonString>;

  // Stats
  primeEngine(): Promise<void>;
  getStats(): Promise<JsonString>;

  // Export (collected results)
  exportJsonEntityReport(flags?: bigint): Promise<JsonString>;
  // CSV text, not JSON — stays a plain string.
  exportCsvEntityReport(csvColumnList: string, flags?: bigint): Promise<string>;
}
