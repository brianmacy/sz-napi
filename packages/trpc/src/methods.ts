/**
 * Method registry — maps each Senzing tRPC procedure to its service,
 * ordered arg names, and whether it's a query or mutation.
 *
 * This is the single source of truth for the positional → named-object
 * conversion used by the client wrapper.
 */

export interface MethodDef {
  service: string;
  method: string;
  args: string[];
  type: 'query' | 'mutation';
}

export const METHOD_REGISTRY: MethodDef[] = [
  // ── Product ────────────────────────────────────────────────────────
  { service: 'product', method: 'getVersion', args: [], type: 'query' },
  { service: 'product', method: 'getLicense', args: [], type: 'query' },

  // ── Engine: Record Operations ──────────────────────────────────────
  { service: 'engine', method: 'addRecord', args: ['dataSourceCode', 'recordId', 'recordDefinition', 'flags'], type: 'mutation' },
  { service: 'engine', method: 'deleteRecord', args: ['dataSourceCode', 'recordId', 'flags'], type: 'mutation' },
  { service: 'engine', method: 'getRecord', args: ['dataSourceCode', 'recordId', 'flags'], type: 'query' },
  { service: 'engine', method: 'getRecordPreview', args: ['recordDefinition', 'flags'], type: 'query' },
  { service: 'engine', method: 'reevaluateRecord', args: ['dataSourceCode', 'recordId', 'flags'], type: 'mutation' },
  { service: 'engine', method: 'reevaluateEntity', args: ['entityId', 'flags'], type: 'mutation' },

  // ── Engine: Entity Retrieval ───────────────────────────────────────
  { service: 'engine', method: 'getEntityById', args: ['entityId', 'flags'], type: 'query' },
  { service: 'engine', method: 'getEntityByRecord', args: ['dataSourceCode', 'recordId', 'flags'], type: 'query' },
  { service: 'engine', method: 'searchByAttributes', args: ['attributes', 'searchProfile', 'flags'], type: 'query' },

  // ── Engine: Why/How Analysis ───────────────────────────────────────
  { service: 'engine', method: 'whySearch', args: ['attributes', 'entityId', 'searchProfile', 'flags'], type: 'query' },
  { service: 'engine', method: 'whyEntities', args: ['entityId1', 'entityId2', 'flags'], type: 'query' },
  { service: 'engine', method: 'whyRecords', args: ['dsCode1', 'recId1', 'dsCode2', 'recId2', 'flags'], type: 'query' },
  { service: 'engine', method: 'whyRecordInEntity', args: ['dataSourceCode', 'recordId', 'flags'], type: 'query' },
  { service: 'engine', method: 'howEntity', args: ['entityId', 'flags'], type: 'query' },
  { service: 'engine', method: 'getVirtualEntity', args: ['recordKeys', 'flags'], type: 'query' },

  // ── Engine: Interesting Entities ───────────────────────────────────
  { service: 'engine', method: 'findInterestingEntitiesById', args: ['entityId', 'flags'], type: 'query' },
  { service: 'engine', method: 'findInterestingEntitiesByRecord', args: ['dataSourceCode', 'recordId', 'flags'], type: 'query' },

  // ── Engine: Pathfinding ────────────────────────────────────────────
  { service: 'engine', method: 'findPath', args: ['startEntityId', 'endEntityId', 'maxDegrees', 'avoidEntityIds', 'requiredDataSources', 'flags'], type: 'query' },
  { service: 'engine', method: 'findNetwork', args: ['entityIds', 'maxDegrees', 'buildOutDegree', 'maxEntities', 'flags'], type: 'query' },

  // ── Engine: Redo ───────────────────────────────────────────────────
  { service: 'engine', method: 'getRedoRecord', args: [], type: 'query' },
  { service: 'engine', method: 'countRedoRecords', args: [], type: 'query' },
  { service: 'engine', method: 'processRedoRecord', args: ['redoRecord', 'flags'], type: 'mutation' },

  // ── Engine: Stats ──────────────────────────────────────────────────
  { service: 'engine', method: 'primeEngine', args: [], type: 'mutation' },
  { service: 'engine', method: 'getStats', args: [], type: 'query' },

  // ── Engine: Export ─────────────────────────────────────────────────
  { service: 'engine', method: 'exportJsonEntityReport', args: ['flags'], type: 'query' },
  { service: 'engine', method: 'exportCsvEntityReport', args: ['csvColumnList', 'flags'], type: 'query' },

  // ── ConfigManager ──────────────────────────────────────────────────
  { service: 'configManager', method: 'createConfig', args: [], type: 'query' },
  { service: 'configManager', method: 'createConfigFromId', args: ['configId'], type: 'query' },
  { service: 'configManager', method: 'createConfigFromDefinition', args: ['configDefinition'], type: 'query' },
  { service: 'configManager', method: 'getConfigRegistry', args: [], type: 'query' },
  { service: 'configManager', method: 'getDefaultConfigId', args: [], type: 'query' },
  { service: 'configManager', method: 'registerConfig', args: ['configDefinition', 'configComment'], type: 'mutation' },
  { service: 'configManager', method: 'replaceDefaultConfigId', args: ['currentDefaultConfigId', 'newDefaultConfigId'], type: 'mutation' },
  { service: 'configManager', method: 'setDefaultConfig', args: ['configDefinition', 'configComment'], type: 'mutation' },
  { service: 'configManager', method: 'setDefaultConfigId', args: ['configId'], type: 'mutation' },

  // ── Diagnostic ─────────────────────────────────────────────────────
  { service: 'diagnostic', method: 'checkRepositoryPerformance', args: ['secondsToRun'], type: 'query' },
  { service: 'diagnostic', method: 'getFeature', args: ['featureId'], type: 'query' },
  { service: 'diagnostic', method: 'getRepositoryInfo', args: [], type: 'query' },
  { service: 'diagnostic', method: 'purgeRepository', args: [], type: 'mutation' },

  // ── Environment ────────────────────────────────────────────────────
  { service: 'environment', method: 'getActiveConfigId', args: [], type: 'query' },
  { service: 'environment', method: 'reinitialize', args: ['configId'], type: 'mutation' },
  { service: 'environment', method: 'isDestroyed', args: [], type: 'query' },
];

/** Lookup map: "service.method" → MethodDef */
export const METHOD_MAP = new Map<string, MethodDef>(
  METHOD_REGISTRY.map(d => [`${d.service}.${d.method}`, d]),
);
