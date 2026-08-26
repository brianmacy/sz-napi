/**
 * A string containing a JSON document, exactly as the Senzing engine produced
 * it. Callers `JSON.parse` it when they need the structured value.
 *
 * This is a plain `string` alias — zero runtime cost, fully assignable to and
 * from `string`, no casts required. It mirrors the JSON-text contract shared by
 * every Senzing V4 binding (Rust's `JsonString` newtype; the `String`/`string`/
 * `str` returns of Java, C#, Python, and the native TypeScript surface). It is
 * also the seam for a future typed-returns effort: it can later carry the
 * parsed shape as `JsonString<T>` without breaking callers, who only ever
 * receive and parse it.
 *
 * `JsonString` vs plain `string` — key on DATA-FLOW DIRECTION, not on whether
 * the payload happens to be JSON:
 *   - `JsonString` — a result the caller is expected to parse and READ
 *     (entities, search/why/how results, stats, version, config registry, …).
 *   - plain `string` — an opaque value handed straight BACK to the engine
 *     (a redo record round-tripped to `processRedoRecord`; a config definition
 *     passed to `registerConfig`/`setDefaultConfig`) even when that text is
 *     itself JSON, plus genuinely non-JSON text like a CSV export.
 * A redo record is the trap: it looks like JSON but is round-tripped, so it is
 * `string`. Classifying by "is it JSON" would mis-type it.
 */
export type JsonString = string;

/**
 * A record key identifying a specific record by data source and record ID.
 * Used by getVirtualEntity to specify which records to combine.
 */
export interface RecordKey {
  dataSourceCode: string;
  recordId: string;
}
