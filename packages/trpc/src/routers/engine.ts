import { TRPCError } from '@trpc/server';
import { t } from '../trpc.js';
import * as s from '../schemas.js';
import { toTRPCError } from '../errors.js';
import type { SzContext } from '../context.js';

/** Wrap a handler so Senzing errors become typed TRPCErrors. */
function szCall<T>(fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    throw toTRPCError(err);
  }
}

export const engineRouter = t.router({
  // ── Record Operations ───────────────────────────────────────────

  addRecord: t.procedure
    .input(s.addRecord)
    .mutation(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.addRecord(input.dataSourceCode, input.recordId, input.recordDefinition, input.flags)),
      );
    }),

  deleteRecord: t.procedure
    .input(s.deleteRecord)
    .mutation(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.deleteRecord(input.dataSourceCode, input.recordId, input.flags)),
      );
    }),

  getRecord: t.procedure
    .input(s.getRecord)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.getRecord(input.dataSourceCode, input.recordId, input.flags)),
      );
    }),

  getRecordPreview: t.procedure
    .input(s.getRecordPreview)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.getRecordPreview(input.recordDefinition, input.flags)),
      );
    }),

  reevaluateRecord: t.procedure
    .input(s.reevaluateRecord)
    .mutation(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.reevaluateRecord(input.dataSourceCode, input.recordId, input.flags)),
      );
    }),

  reevaluateEntity: t.procedure
    .input(s.reevaluateEntity)
    .mutation(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.reevaluateEntity(input.entityId, input.flags)),
      );
    }),

  // ── Entity Retrieval ────────────────────────────────────────────

  getEntityById: t.procedure
    .input(s.getEntityById)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.getEntityById(input.entityId, input.flags)),
      );
    }),

  getEntityByRecord: t.procedure
    .input(s.getEntityByRecord)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.getEntityByRecord(input.dataSourceCode, input.recordId, input.flags)),
      );
    }),

  searchByAttributes: t.procedure
    .input(s.searchByAttributes)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.searchByAttributes(input.attributes, input.searchProfile, input.flags)),
      );
    }),

  // ── Why / How Analysis ──────────────────────────────────────────

  whySearch: t.procedure
    .input(s.whySearch)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.whySearch(input.attributes, input.entityId, input.searchProfile, input.flags)),
      );
    }),

  whyEntities: t.procedure
    .input(s.whyEntities)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.whyEntities(input.entityId1, input.entityId2, input.flags)),
      );
    }),

  whyRecords: t.procedure
    .input(s.whyRecords)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.whyRecords(input.dsCode1, input.recId1, input.dsCode2, input.recId2, input.flags)),
      );
    }),

  whyRecordInEntity: t.procedure
    .input(s.whyRecordInEntity)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.whyRecordInEntity(input.dataSourceCode, input.recordId, input.flags)),
      );
    }),

  howEntity: t.procedure
    .input(s.howEntity)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.howEntity(input.entityId, input.flags)),
      );
    }),

  getVirtualEntity: t.procedure
    .input(s.getVirtualEntity)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.getVirtualEntity(input.recordKeys, input.flags)),
      );
    }),

  // ── Interesting Entities ────────────────────────────────────────

  findInterestingEntitiesById: t.procedure
    .input(s.findInterestingEntitiesById)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.findInterestingEntitiesById(input.entityId, input.flags)),
      );
    }),

  findInterestingEntitiesByRecord: t.procedure
    .input(s.findInterestingEntitiesByRecord)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.findInterestingEntitiesByRecord(input.dataSourceCode, input.recordId, input.flags)),
      );
    }),

  // ── Pathfinding ─────────────────────────────────────────────────

  findPath: t.procedure
    .input(s.findPath)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.findPath(
          input.startEntityId, input.endEntityId, input.maxDegrees,
          input.avoidEntityIds, input.requiredDataSources, input.flags,
        )),
      );
    }),

  findNetwork: t.procedure
    .input(s.findNetwork)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.findNetwork(
          input.entityIds, input.maxDegrees, input.buildOutDegree,
          input.maxEntities, input.flags,
        )),
      );
    }),

  // ── Redo ────────────────────────────────────────────────────────

  getRedoRecord: t.procedure
    .query(({ ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() => JSON.parse(engine.getRedoRecord()));
    }),

  countRedoRecords: t.procedure
    .query(({ ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() => engine.countRedoRecords());
    }),

  processRedoRecord: t.procedure
    .input(s.processRedoRecord)
    .mutation(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() =>
        JSON.parse(engine.processRedoRecord(input.redoRecord, input.flags)),
      );
    }),

  // ── Stats ───────────────────────────────────────────────────────

  primeEngine: t.procedure
    .mutation(({ ctx }) => {
      const { engine } = ctx as SzContext;
      szCall(() => engine.primeEngine());
    }),

  getStats: t.procedure
    .query(({ ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() => JSON.parse(engine.getStats()));
    }),

  // ── Export (collected, not streamed) ────────────────────────────
  // The native export API is handle-based (exportJsonEntityReport →
  // fetchNext → closeExport). We collect results server-side and
  // return the full dataset. For large exports, consumers should
  // use the streaming variant or paginate via flags.

  exportJsonEntityReport: t.procedure
    .input(s.exportJsonEntityReport)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() => {
        const iter = (engine as any).exportJsonEntityReport(input.flags);
        const chunks: string[] = [];
        for (const chunk of iter) {
          chunks.push(chunk);
        }
        return JSON.parse(chunks.join(''));
      });
    }),

  exportCsvEntityReport: t.procedure
    .input(s.exportCsvEntityReport)
    .query(({ input, ctx }) => {
      const { engine } = ctx as SzContext;
      return szCall(() => {
        const iter = (engine as any).exportCsvEntityReport(input.csvColumnList, input.flags);
        const lines: string[] = [];
        for (const chunk of iter) {
          lines.push(chunk);
        }
        return lines.join('');
      });
    }),
});
