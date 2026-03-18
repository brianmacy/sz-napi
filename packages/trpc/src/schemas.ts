/**
 * Zod schemas for all Senzing tRPC procedure inputs.
 *
 * bigint flags are accepted as strings over the wire and coerced back,
 * since JSON cannot represent bigint natively. superjson handles this
 * transparently when configured as the tRPC transformer.
 */
import { z } from 'zod';

// ── Shared ──────────────────────────────────────────────────────────

export const flags = z.bigint().optional();

export const recordKey = z.object({
  dataSourceCode: z.string(),
  recordId: z.string(),
});

// ── SzEngine: Record Operations ─────────────────────────────────────

export const addRecord = z.object({
  dataSourceCode: z.string(),
  recordId: z.string(),
  recordDefinition: z.string(),
  flags,
});

export const deleteRecord = z.object({
  dataSourceCode: z.string(),
  recordId: z.string(),
  flags,
});

export const getRecord = z.object({
  dataSourceCode: z.string(),
  recordId: z.string(),
  flags,
});

export const getRecordPreview = z.object({
  recordDefinition: z.string(),
  flags,
});

export const reevaluateRecord = z.object({
  dataSourceCode: z.string(),
  recordId: z.string(),
  flags,
});

export const reevaluateEntity = z.object({
  entityId: z.number(),
  flags,
});

// ── SzEngine: Entity Operations ─────────────────────────────────────

export const getEntityById = z.object({
  entityId: z.number(),
  flags,
});

export const getEntityByRecord = z.object({
  dataSourceCode: z.string(),
  recordId: z.string(),
  flags,
});

export const searchByAttributes = z.object({
  attributes: z.string(),
  searchProfile: z.string().nullish(),
  flags,
});

// ── SzEngine: Why/How Analysis ──────────────────────────────────────

export const whySearch = z.object({
  attributes: z.string(),
  entityId: z.number(),
  searchProfile: z.string().nullish(),
  flags,
});

export const whyEntities = z.object({
  entityId1: z.number(),
  entityId2: z.number(),
  flags,
});

export const whyRecords = z.object({
  dsCode1: z.string(),
  recId1: z.string(),
  dsCode2: z.string(),
  recId2: z.string(),
  flags,
});

export const whyRecordInEntity = z.object({
  dataSourceCode: z.string(),
  recordId: z.string(),
  flags,
});

export const howEntity = z.object({
  entityId: z.number(),
  flags,
});

export const getVirtualEntity = z.object({
  recordKeys: z.array(recordKey),
  flags,
});

// ── SzEngine: Interesting Entities ──────────────────────────────────

export const findInterestingEntitiesById = z.object({
  entityId: z.number(),
  flags,
});

export const findInterestingEntitiesByRecord = z.object({
  dataSourceCode: z.string(),
  recordId: z.string(),
  flags,
});

// ── SzEngine: Pathfinding ───────────────────────────────────────────

export const findPath = z.object({
  startEntityId: z.number(),
  endEntityId: z.number(),
  maxDegrees: z.number(),
  avoidEntityIds: z.array(z.number()).nullish(),
  requiredDataSources: z.array(z.string()).nullish(),
  flags,
});

export const findNetwork = z.object({
  entityIds: z.array(z.number()),
  maxDegrees: z.number(),
  buildOutDegree: z.number(),
  maxEntities: z.number(),
  flags,
});

// ── SzEngine: Redo ──────────────────────────────────────────────────

export const processRedoRecord = z.object({
  redoRecord: z.string(),
  flags,
});

// ── SzEngine: Export ────────────────────────────────────────────────

export const exportJsonEntityReport = z.object({
  flags,
});

export const exportCsvEntityReport = z.object({
  csvColumnList: z.string(),
  flags,
});

// ── SzConfigManager ─────────────────────────────────────────────────

export const createConfigFromId = z.object({
  configId: z.number(),
});

export const createConfigFromDefinition = z.object({
  configDefinition: z.string(),
});

export const registerConfig = z.object({
  configDefinition: z.string(),
  configComment: z.string().nullish(),
});

export const replaceDefaultConfigId = z.object({
  currentDefaultConfigId: z.number(),
  newDefaultConfigId: z.number(),
});

export const setDefaultConfig = z.object({
  configDefinition: z.string(),
  configComment: z.string().nullish(),
});

export const setDefaultConfigId = z.object({
  configId: z.number(),
});

// ── SzDiagnostic ────────────────────────────────────────────────────

export const checkRepositoryPerformance = z.object({
  secondsToRun: z.number(),
});

export const getFeature = z.object({
  featureId: z.number(),
});
