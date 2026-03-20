/**
 * A record key identifying a specific record by data source and record ID.
 * Used by getVirtualEntity to specify which records to combine.
 */
export interface RecordKey {
  dataSourceCode: string;
  recordId: string;
}
