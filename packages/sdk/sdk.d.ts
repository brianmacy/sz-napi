export {
  SzConfigManager,
  SzDiagnostic,
  SzEnvironment,
  SzProduct,
  FlagEntry,
  RecordKey,
  SzLogging,
  SzLogRegistration,
  SzLogCapture,
  SzLogRecord,
  SzLogCallbackOptions,
  SzLogOutput,
  getLogging,
} from './index';

export { SzEngine } from './index';

export { bridgeVersion } from './index';

export {
  SzError,
  SzBadInputError,
  SzNotFoundError,
  SzUnknownDataSourceError,
  SzConfigurationError,
  SzRetryableError,
  SzDatabaseConnectionLostError,
  SzDatabaseTransientError,
  SzRetryTimeoutExceededError,
  SzUnrecoverableError,
  SzDatabaseError,
  SzLicenseError,
  SzNotInitializedError,
  SzUnhandledError,
  SzReplaceConflictError,
  SzEnvironmentDestroyedError,
  SzErrorOptions,
  mapToSzError,
} from './js/errors';

export declare const SzFlags: Readonly<Record<string, bigint>>;

/**
 * A Senzing log level name, most verbose first. `'OFF'` is a filter value only, never a record's
 * level. Level arguments are case-insensitive and also accept `'warning'`.
 *
 * Native writes its own spellings in formatted messages (JSONL `severity` is lower case with
 * `warning`; LEGACY tags are `TRCE`, `DBUG`, `INFO`, `WARN`, `ERR`, `CRIT`).
 */
export type SzLogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'OFF';

/**
 * The log level names as constants (`SzLogLevel.Warn === 'WARN'`); `ALL` lists them most verbose
 * first. Built from the native binding.
 *
 * @example Compare levels by rank
 * ```typescript
 * import { SzLogLevel } from "@senzing/sdk";
 *
 * const rank = (level: SzLogLevel) => SzLogLevel.ALL.indexOf(level);
 * const isWarnOrWorse = (level: SzLogLevel) => rank(level) >= rank(SzLogLevel.Warn);
 * ```
 */
export declare const SzLogLevel: Readonly<{
  Trace: 'TRACE';
  Debug: 'DEBUG';
  Info: 'INFO';
  Warn: 'WARN';
  Error: 'ERROR';
  Critical: 'CRITICAL';
  Off: 'OFF';
  ALL: readonly SzLogLevel[];
}>;

/**
 * A Senzing log message format, applied by native. Format arguments are case-insensitive and also
 * accept `'json'`.
 *
 * - `'LEGACY'`: `YYYY-MM-DD HH:MM:SS.mmm [module:hash] SEV: msg`, local time.
 * - `'JSONL'`: one JSON object per line (`timestamp`, `module`, `severity`, `message`).
 * - `'BARE'`: the message text only (the default for callbacks).
 * - `'DEFAULT'`: spdlog's default pattern for the default output; the message only for a callback.
 */
export type SzLogFormat = 'LEGACY' | 'JSONL' | 'BARE' | 'DEFAULT';

/** The log format names as constants (`SzLogFormat.Jsonl === 'JSONL'`). Built from the native binding. */
export declare const SzLogFormat: Readonly<{
  Legacy: 'LEGACY';
  Jsonl: 'JSONL';
  Bare: 'BARE';
  Default: 'DEFAULT';
  ALL: readonly SzLogFormat[];
}>;

/** Iterator for streaming entity export results. */
export declare class SzExportIterator {
  /** Fetches the next chunk of export data. Returns empty string when complete. */
  next(): string;
  /** Closes the export and releases resources. Safe to call multiple times. */
  close(): void;
  [Symbol.iterator](): Iterator<string>;
}

declare module './index' {
  interface SzEnvironment {
    /**
     * Creates a new SzEnvironment instance.
     *
     * @example Create an environment with default settings
     * ```typescript
     * import { SzEnvironment } from "@senzing/sz-sdk";
     *
     * const env = new SzEnvironment("myApp", settings);
     * try {
     *   const engine = env.getEngine();
     *   // ... use engine ...
     * } finally {
     *   env.destroy();
     * }
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/environment-and-hubs | environment-and-hubs snippet}
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/lifecycle-patterns | lifecycle-patterns snippet}
     */
    constructor(moduleName: string, settings: string, verboseLogging?: boolean | undefined | null);

    /**
     * Destroys the environment and releases native resources.
     *
     * @example Always destroy in a finally block
     * ```typescript
     * const env = new SzEnvironment("myApp", settings);
     * try {
     *   const engine = env.getEngine();
     *   engine.addRecord("CUSTOMERS", "1001", recordJson);
     * } finally {
     *   env.destroy();
     * }
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/lifecycle-patterns | lifecycle-patterns snippet}
     */
    destroy(): void;

    /**
     * Checks if the environment has been destroyed.
     *
     * @example Guard against using a destroyed environment
     * ```typescript
     * if (env.isDestroyed()) {
     *   throw new Error("Environment is no longer available");
     * }
     * const engine = env.getEngine();
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/lifecycle-patterns | lifecycle-patterns snippet}
     */
    isDestroyed(): boolean;

    /**
     * Reinitializes the environment with a different configuration.
     *
     * @example Reinitialize after updating configuration
     * ```typescript
     * const configMgr = env.getConfigManager();
     * const configDef = configMgr.createConfig();
     * const configId = configMgr.setDefaultConfig(configDef, "added data sources");
     * env.reinitialize(configId);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/register-data-sources | register-data-sources snippet}
     */
    reinitialize(configId: number): void;

    /**
     * Gets the currently active configuration ID.
     *
     * @example Check the active config
     * ```typescript
     * const activeId = env.getActiveConfigId();
     * console.log(`Active configuration ID: ${activeId}`);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/init-default-config | init-default-config snippet}
     */
    getActiveConfigId(): number;

    /**
     * Gets the engine interface for entity resolution operations.
     *
     * @example
     * ```typescript
     * const engine = env.getEngine();
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/environment-and-hubs | environment-and-hubs snippet}
     */
    getEngine(): SzEngine;

    /**
     * Gets the configuration manager interface.
     *
     * @example
     * ```typescript
     * const configMgr = env.getConfigManager();
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/init-default-config | init-default-config snippet}
     */
    getConfigManager(): SzConfigManager;

    /**
     * Gets the diagnostic interface for system monitoring.
     *
     * @example
     * ```typescript
     * const diag = env.getDiagnostic();
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/environment-and-hubs | environment-and-hubs snippet}
     */
    getDiagnostic(): SzDiagnostic;

    /**
     * Gets the product interface for version and license information.
     *
     * @example
     * ```typescript
     * const product = env.getProduct();
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/information/get-version | get-version snippet}
     */
    getProduct(): SzProductWrapper;

    /**
     * Gets the logging interface (Senzing native libSzLogging): callbacks, levels, formats and
     * the default output.
     *
     * Logging is process-global native state, so every `SzLogging` controls the same logger. This
     * call performs no native initialization, so register callbacks **before** the first
     * `getEngine()` / `getDiagnostic()` / `reinitialize()` to capture initialization messages
     * (on Senzing 4.5.0 that is also required, see {@link SzLogging}). Unlike the other getters
     * it also works **after** `destroy()`. The module-level `getLogging()` returns the same
     * interface without needing an environment.
     *
     * @example Register before the engine starts, unregister after destroy
     * ```typescript
     * const env = new SzEnvironment("myApp", settings);
     * const logging = env.getLogging();
     * const registration = logging.registerCallback("INFO", (record) => {
     *   console.log(`[${record.level}] ${record.module}: ${record.message}`);
     * });
     * const engine = env.getEngine(); // initialization messages reach the callback
     * // ... use the engine ...
     * env.destroy();
     * registration.unregister(); // after destroy: nothing else is logging
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/logging/log-callback | log-callback snippet}
     */
    getLogging(): SzLogging;
  }

  /**
   * Senzing native logging (libSzLogging, Senzing 4.5.0).
   *
   * All state lives in native: each method is one native call, each registration its own native
   * registration. Methods that need Senzing >= 4.5.1 / 4.6.0 throw `SzConfigurationError` until
   * then.
   *
   * **Senzing 4.5.0 usage rule** (documented, not enforced): change registrations, the default
   * callback, the default output or the default format only while no engine threads run: before
   * the first engine initialization (`getEngine()`, `getDiagnostic()`, `reinitialize()`) or after
   * `destroy()`. `setDefaultLogLevel` and `getEffectiveLogLevel` are safe at any time.
   *
   * **Delivery:** native calls a callback on the thread that logs (often an engine thread). The
   * SDK queues the record without blocking that thread and the JS callback runs later,
   * asynchronously, on the JS thread that registered it, so a record logged during a synchronous
   * engine call arrives after that call returns. The queue is unbounded unless the callback's
   * options set `maxQueued` (records over the cap are dropped and counted, see
   * `SzLogRegistration.getDropped`). For `TRACE` during bulk loads prefer a `'FILE'` default
   * output to a JS callback. An exception thrown by a callback is reported as an uncaught
   * exception (`process.on('uncaughtException')`), and delivery continues.
   *
   * **Re-entrancy:** a JS callback runs on the event loop, not on native's logging stack, so
   * unlike in Rust it may unregister its own registration, call `registerCallback`, the
   * `setDefault*` methods or the engine. Records already queued when a registration is
   * unregistered (even from inside its own callback) are still delivered. On Senzing 4.5.0 the
   * usage rule above still applies to these calls while engine threads run.
   *
   * **Worker threads:** a registration delivers to the worker that made it. Unregister it before
   * the worker exits: once the worker's JS environment is gone the registration can no longer be
   * removed, stays registered for the rest of the process (records for it are skipped) and keeps
   * the effective level at or below its `minLevel`.
   *
   * **Process lifetime:** registrations and default callbacks never keep the Node.js process
   * alive; records still queued when the process exits are discarded.
   */
  interface SzLogging {
    /**
     * Registers a callback for log records from every thread.
     *
     * `options` is a level (`"INFO"`) or `{ minLevel, format?, maxQueued? }`; the format
     * defaults to `'BARE'` (the record already carries level and module) and the queue is
     * unbounded unless `maxQueued` is set. While the registration lives, native lowers the
     * effective level to `minLevel` if needed.
     *
     * The registration is removed by `unregister()` or by disposal (`using registration = ...`).
     * Garbage collection never unregisters (it could run while engine threads log): a
     * registration dropped without `unregister()` stays registered for the rest of the process,
     * and the SDK emits a process warning (code `SZ_LOG_REGISTRATION_COLLECTED`) when it is
     * collected. Call `leak()` to keep a registration on purpose without the warning.
     *
     * @example
     * ```typescript
     * const logging = env.getLogging();
     * logging.setDefaultOutput({ type: "NULL" }); // the callback is the only sink
     * const registration = logging.registerCallback(
     *   { minLevel: "WARN", format: "JSONL" },
     *   (record) => console.log(record.message),
     * );
     * ```
     *
     * @throws {SzBadInputError} an unknown level or format, or a wrong argument shape (the
     * message names the field)
     * @throws {SzUnrecoverableError} native refused the registration (process exit in progress)
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/logging/log-callback | log-callback snippet}
     */
    registerCallback(options: SzLogLevel | SzLogCallbackOptions, callback: (record: SzLogRecord) => void): SzLogRegistration;

    /**
     * Registers a callback for records logged on the calling OS thread only.
     *
     * **Requires Senzing >= 4.5.1 / 4.6.0.** Senzing 4.5.0 accepts a thread-local registration
     * but never delivers to it (GDEV-4960), so on 4.5.0 this throws `SzConfigurationError`.
     * Until then, register a process-wide callback and group records by `threadHash`.
     *
     * @throws {SzConfigurationError} on Senzing 4.5.0
     */
    registerThreadLocalCallback(options: SzLogLevel | SzLogCallbackOptions, callback: (record: SzLogRecord) => void): SzLogRegistration;

    /**
     * Captures the records logged on the calling thread until `finish()`, synchronously (no
     * event-loop delivery). **Requires Senzing >= 4.5.1 / 4.6.0**.
     *
     * @throws {SzConfigurationError} on Senzing 4.5.0
     */
    captureThreadLogs(options: SzLogLevel | SzLogCallbackOptions): SzLogCapture;

    /**
     * Makes `callback` the default output, at `minLevel` and in `format` (default `'BARE'`).
     *
     * There is no handle: the callback stays until `setDefaultOutput` or another
     * `setDefaultCallback` replaces it. On Senzing 4.5.0 a replaced callback is leaked (no
     * release hook), so set it once. `setDefaultLogLevel` changes its level later.
     * `maxQueued` caps its queue as for `registerCallback`; with no handle, the dropped count is
     * not observable.
     *
     * @example
     * ```typescript
     * logging.setDefaultCallback("WARN", (record) => console.warn(record.message));
     * logging.setDefaultOutput({ type: "STDERR" }); // replaces the callback
     * ```
     */
    setDefaultCallback(options: SzLogLevel | SzLogCallbackOptions, callback: (record: SzLogRecord) => void): void;

    /**
     * Sets the default output. The default level is kept; on Senzing 4.5.0 the default format
     * resets to `'LEGACY'`, so call `setDefaultFormat` **after** this.
     *
     * A `'FILE'` output is first opened for append (creating missing parent directories, as
     * native does) and throws `SzBadInputError` naming the path if it cannot be opened; the
     * previous output is kept. A file output is flushed when the output is replaced or at process
     * exit; on Senzing 4.5.0 `destroy()` does not flush it, so call `setDefaultOutput(...)` after
     * `destroy()` before reading the file.
     *
     * @example Write JSONL to a file
     * ```typescript
     * logging.setDefaultOutput({ type: "FILE", path: "/var/log/senzing/sz.jsonl" });
     * logging.setDefaultFormat("JSONL");
     * ```
     *
     * @throws {SzBadInputError} `'CALLBACK'` (get-only), a missing or empty path, or an unopenable file
     * @throws {SzConfigurationError} `append: true` (needs Senzing >= 4.5.1 / 4.6.0)
     */
    setDefaultOutput(output: SzLogOutput): void;

    /**
     * The current default output. **Requires Senzing >= 4.5.1 / 4.6.0.**
     *
     * @throws {SzConfigurationError} on Senzing 4.5.0
     */
    getDefaultOutput(): SzLogOutput;

    /**
     * Sets the default output's format; registered callbacks keep their own. Marks native
     * logging as user-configured: an init's `verboseLogging` no longer changes the default level
     * or format.
     *
     * @throws {SzBadInputError} an unknown format
     */
    setDefaultFormat(format: SzLogFormat): void;

    /**
     * The default output's format. **Requires Senzing >= 4.5.1 / 4.6.0.**
     *
     * @throws {SzConfigurationError} on Senzing 4.5.0
     */
    getDefaultFormat(): SzLogFormat;

    /**
     * Sets the default output's level; registered callbacks keep their own. Safe at any time.
     * Marks native logging as user-configured, like `setDefaultFormat`.
     *
     * @example Toggle verbose logging while the engine runs
     * ```typescript
     * logging.setDefaultLogLevel(SzLogLevel.Debug);
     * // ...
     * logging.setDefaultLogLevel(SzLogLevel.Error);
     * ```
     *
     * @throws {SzBadInputError} an unknown level
     */
    setDefaultLogLevel(level: SzLogLevel): void;

    /**
     * The default output's level. **Requires Senzing >= 4.5.1 / 4.6.0.**
     *
     * @throws {SzConfigurationError} on Senzing 4.5.0
     */
    getDefaultLogLevel(): SzLogLevel;

    /**
     * The effective level: the minimum over the default output and every registered callback. A
     * message below it is not even formatted. Safe at any time.
     *
     * @example
     * ```typescript
     * logging.setDefaultLogLevel("ERROR");
     * const registration = logging.registerCallback("DEBUG", () => {});
     * logging.getEffectiveLogLevel(); // "DEBUG"
     * ```
     */
    getEffectiveLogLevel(): SzLogLevel;
  }

  /**
   * A live native log callback registration, returned by `SzLogging.registerCallback`.
   * Disposable: `using registration = logging.registerCallback(...)` unregisters at scope exit.
   * Collected without `unregister()` / `leak()`, it stays registered and the SDK emits a
   * process warning (`SZ_LOG_REGISTRATION_COLLECTED`).
   */
  interface SzLogRegistration {
    /**
     * Unregisters the callback; calling it again does nothing. Records already queued are still
     * delivered. Allowed from inside the registration's own callback. On Senzing 4.5.0 call it
     * only while no engine threads run (before the first engine initialization or after
     * `destroy()`).
     */
    unregister(): void;

    /**
     * Keeps the callback registered for the rest of the process, with no way to remove it (and
     * no collection warning).
     */
    leak(): void;

    /**
     * How many records were dropped because `maxQueued` records were already waiting for the
     * callback. Always 0 without `maxQueued`. Still readable after `unregister()` / `leak()`.
     *
     * @example Bound memory while the JS thread is busy
     * ```typescript
     * const registration = logging.registerCallback(
     *   { minLevel: "DEBUG", maxQueued: 10_000 },
     *   (record) => sink.write(record.message),
     * );
     * // ...
     * console.log(`dropped ${registration.getDropped()} records`);
     * ```
     */
    getDropped(): number;

    /**
     * Changes this callback's minimum level. **Requires Senzing >= 4.5.1 / 4.6.0.** Until then,
     * `SzLogging.setDefaultLogLevel` changes the default output's level at any time.
     *
     * @throws {SzConfigurationError} on Senzing 4.5.0
     * @throws {SzBadInputError} an unknown level, or the registration was unregistered or leaked
     */
    setLevel(minLevel: SzLogLevel): void;

    /**
     * This callback's current minimum level. **Requires Senzing >= 4.5.1 / 4.6.0.**
     *
     * @throws {SzConfigurationError} on Senzing 4.5.0
     * @throws {SzBadInputError} the registration was unregistered or leaked
     */
    getLevel(): SzLogLevel;

    /** Same as `unregister()`. */
    [Symbol.dispose](): void;
  }

  interface SzEngine {
    /**
     * Adds a record for entity resolution.
     *
     * @example Add a record with WITH_INFO
     * ```typescript
     * const info = engine.addRecord(
     *   "CUSTOMERS", "1001",
     *   JSON.stringify({ NAME_FULL: "Robert Smith", DATE_OF_BIRTH: "1985-02-15" }),
     *   SzFlags.WITH_INFO,
     * );
     * const affected = JSON.parse(info).AFFECTED_ENTITIES;
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/loading/load-records | load-records snippet}
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/loading/load-with-info | load-with-info snippet}
     */
    addRecord(dataSourceCode: string, recordId: string, recordDefinition: string, flags?: bigint | undefined | null): string;

    /**
     * Deletes a record from the entity repository.
     *
     * @example Delete a record
     * ```typescript
     * const info = engine.deleteRecord("CUSTOMERS", "1001", SzFlags.WITH_INFO);
     * console.log("Affected entities:", JSON.parse(info).AFFECTED_ENTITIES);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/deleting/delete-records | delete-records snippet}
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/deleting/delete-loop | delete-loop snippet}
     */
    deleteRecord(dataSourceCode: string, recordId: string, flags?: bigint | undefined | null): string;

    /**
     * Gets entity information by entity ID.
     *
     * @example Retrieve an entity by ID
     * ```typescript
     * const result = engine.getEntityById(1, SzFlags.ENTITY_DEFAULT_FLAGS);
     * const entity = JSON.parse(result).RESOLVED_ENTITY;
     * console.log("Entity name:", entity.ENTITY_NAME);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/searching/search-records | search-records snippet}
     */
    getEntityById(entityId: number, flags?: bigint | undefined | null): string;

    /**
     * Gets entity information by record key (data source + record ID).
     *
     * @example Retrieve an entity by its source record
     * ```typescript
     * const result = engine.getEntityByRecord(
     *   "CUSTOMERS", "1001",
     *   SzFlags.ENTITY_DEFAULT_FLAGS,
     * );
     * const entity = JSON.parse(result).RESOLVED_ENTITY;
     * console.log("Entity ID:", entity.ENTITY_ID);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/loading/load-with-info | load-with-info snippet}
     */
    getEntityByRecord(dataSourceCode: string, recordId: string, flags?: bigint | undefined | null): string;

    /**
     * Searches for entities by attributes.
     *
     * @example Search for matching entities
     * ```typescript
     * const attrs = JSON.stringify({ NAME_FULL: "Robert Smith", DATE_OF_BIRTH: "1985-02-15" });
     * const result = engine.searchByAttributes(attrs, undefined, SzFlags.SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS);
     * const entities = JSON.parse(result).RESOLVED_ENTITIES;
     * console.log(`Found ${entities.length} matching entities`);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/searching/search-records | search-records snippet}
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/searching/search-worker-pool | search-worker-pool snippet}
     */
    searchByAttributes(attributes: string, searchProfile?: string | undefined | null, flags?: bigint | undefined | null): string;

    /**
     * Analyzes why two entities are related.
     *
     * @example Compare two entities
     * ```typescript
     * const result = engine.whyEntities(1, 2, SzFlags.WHY_ENTITIES_DEFAULT_FLAGS);
     * const whyResults = JSON.parse(result).WHY_RESULTS;
     * console.log("Match level:", whyResults[0].MATCH_INFO.WHY_KEY);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/searching/why-search | why-search snippet}
     */
    whyEntities(entityId1: number, entityId2: number, flags?: bigint | undefined | null): string;

    /**
     * Analyzes why two records resolved together.
     *
     * @example Why two records resolved
     * ```typescript
     * const result = engine.whyRecords(
     *   "CUSTOMERS", "1001",
     *   "WATCHLIST", "2001",
     *   SzFlags.WHY_RECORDS_DEFAULT_FLAGS,
     * );
     * const whyResults = JSON.parse(result).WHY_RESULTS;
     * console.log("Match key:", whyResults[0].MATCH_INFO.MATCH_KEY);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/searching/why-search | why-search snippet}
     */
    whyRecords(dsCode1: string, recId1: string, dsCode2: string, recId2: string, flags?: bigint | undefined | null): string;

    /**
     * Starts a JSON entity export. Returns an SzExportIterator.
     *
     * @example Stream all resolved entities
     * ```typescript
     * const iter = engine.exportJsonEntityReport(SzFlags.EXPORT_DEFAULT_FLAGS);
     * for (const chunk of iter) {
     *   const lines = chunk.split("\n").filter(Boolean);
     *   for (const line of lines) {
     *     const entity = JSON.parse(line);
     *     console.log("Entity:", entity.RESOLVED_ENTITY.ENTITY_ID);
     *   }
     * }
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/loading/load-records | load-records snippet}
     */
    exportJsonEntityReport(flags?: bigint | undefined | null): SzExportIterator;

    /**
     * Starts a CSV entity export. Returns an SzExportIterator.
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/loading/load-records | load-records snippet}
     */
    exportCsvEntityReport(csvColumnList: string, flags?: bigint | undefined | null): SzExportIterator;

    /**
     * Counts pending redo records in the queue.
     *
     * @example Check for pending redo records
     * ```typescript
     * const count = engine.countRedoRecords();
     * console.log(`${count} redo records pending`);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/redo/redo-continuous | redo-continuous snippet}
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/redo/load-with-redo | load-with-redo snippet}
     */
    countRedoRecords(): number;

    /**
     * Gets the next pending redo record from the queue.
     *
     * @example Fetch the next redo record
     * ```typescript
     * const redo = engine.getRedoRecord();
     * if (redo) {
     *   const info = engine.processRedoRecord(redo, SzFlags.WITH_INFO);
     *   console.log("Processed redo:", JSON.parse(info).AFFECTED_ENTITIES);
     * }
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/redo/redo-continuous | redo-continuous snippet}
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/redo/redo-with-info | redo-with-info snippet}
     */
    getRedoRecord(): string;

    /**
     * Processes a redo record for deferred resolution.
     *
     * @example Process a redo record with info
     * ```typescript
     * const redo = engine.getRedoRecord();
     * if (redo) {
     *   const info = engine.processRedoRecord(redo, SzFlags.WITH_INFO);
     *   console.log("Affected:", JSON.parse(info).AFFECTED_ENTITIES);
     * }
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/redo/redo-with-info | redo-with-info snippet}
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/redo/redo-worker-pool | redo-worker-pool snippet}
     */
    processRedoRecord(redoRecord: string, flags?: bigint | undefined | null): string;

    /**
     * Primes the engine for optimal performance by loading internal caches.
     *
     * @example Prime the engine after initialization
     * ```typescript
     * const engine = env.getEngine();
     * engine.primeEngine();
     * console.log("Engine caches loaded");
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/engine-priming | engine-priming snippet}
     */
    primeEngine(): void;

    /**
     * Gets engine performance statistics as a JSON string.
     *
     * @example Log engine statistics
     * ```typescript
     * const stats = JSON.parse(engine.getStats());
     * console.log("Workload stats:", JSON.stringify(stats.workload, null, 2));
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/engine-priming | engine-priming snippet}
     */
    getStats(): string;

    /**
     * Reevaluates all records for a specific entity.
     *
     * @example Reevaluate an entity after rule changes
     * ```typescript
     * const info = engine.reevaluateEntity(1, SzFlags.WITH_INFO);
     * const affected = JSON.parse(info).AFFECTED_ENTITIES;
     * console.log("Reevaluation affected:", affected.length, "entities");
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/stewardship/force-resolve | force-resolve snippet}
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/stewardship/force-unresolve | force-unresolve snippet}
     */
    reevaluateEntity(entityId: number, flags?: bigint | undefined | null): string;

    /**
     * Finds a relationship path between two entities.
     *
     * @example Find a path between two entities
     * ```typescript
     * const result = engine.findPath(
     *   1, 2, 3,
     *   undefined, undefined,
     *   SzFlags.FIND_PATH_DEFAULT_FLAGS,
     * );
     * const path = JSON.parse(result).ENTITY_PATHS[0];
     * console.log("Path length:", path.ENTITIES.length);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/searching/search-records | search-records snippet}
     */
    findPath(startEntityId: number, endEntityId: number, maxDegrees: number, avoidEntityIds?: Array<number> | undefined | null, requiredDataSources?: Array<string> | undefined | null, flags?: bigint | undefined | null): string;

    /**
     * Finds a network of related entities starting from seed entity IDs.
     *
     * @example Build a network around seed entities
     * ```typescript
     * const result = engine.findNetwork(
     *   [1, 2], 3, 1, 100,
     *   SzFlags.FIND_NETWORK_DEFAULT_FLAGS,
     * );
     * const network = JSON.parse(result);
     * console.log("Entities in network:", network.ENTITY_PATHS.length);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/searching/search-records | search-records snippet}
     */
    findNetwork(entityIds: Array<number>, maxDegrees: number, buildOutDegree: number, maxEntities: number, flags?: bigint | undefined | null): string;
  }

  interface SzConfigManager {
    /**
     * Creates a new configuration from the default template and exports it as JSON.
     *
     * @example Create a template configuration
     * ```typescript
     * const configMgr = env.getConfigManager();
     * const configDef = configMgr.createConfig();
     * const config = JSON.parse(configDef);
     * console.log("Data sources:", config.G2_CONFIG.CFG_DSRC);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/init-default-config | init-default-config snippet}
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/register-data-sources | register-data-sources snippet}
     */
    createConfig(): string;

    /**
     * Registers and activates a configuration in one operation, returning the assigned ID.
     *
     * @example Register and activate a configuration
     * ```typescript
     * const configMgr = env.getConfigManager();
     * const configDef = configMgr.createConfig();
     * const configId = configMgr.setDefaultConfig(configDef, "initial config");
     * console.log("Active config ID:", configId);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/init-default-config | init-default-config snippet}
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/register-data-sources | register-data-sources snippet}
     */
    setDefaultConfig(configDefinition: string, configComment?: string | undefined | null): number;

    /**
     * Registers a new configuration version and returns the assigned configuration ID.
     *
     * @example Register a config without activating it
     * ```typescript
     * const configMgr = env.getConfigManager();
     * const configDef = configMgr.createConfig();
     * const configId = configMgr.registerConfig(configDef, "staging config");
     * console.log("Registered config ID:", configId);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/register-data-sources | register-data-sources snippet}
     */
    registerConfig(configDefinition: string, configComment?: string | undefined | null): number;

    /**
     * Sets the active configuration by ID.
     *
     * @example Activate a previously registered config
     * ```typescript
     * const configMgr = env.getConfigManager();
     * configMgr.setDefaultConfigId(configId);
     * env.reinitialize(configId);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/init-default-config | init-default-config snippet}
     */
    setDefaultConfigId(configId: number): void;

    /**
     * Atomically replaces the default configuration ID (optimistic locking).
     *
     * @example Atomic config swap with conflict detection
     * ```typescript
     * const configMgr = env.getConfigManager();
     * const currentId = configMgr.getDefaultConfigId();
     * const configDef = configMgr.createConfig();
     * const newId = configMgr.registerConfig(configDef, "updated config");
     * configMgr.replaceDefaultConfigId(currentId, newId);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/register-data-sources | register-data-sources snippet}
     */
    replaceDefaultConfigId(currentDefaultConfigId: number, newDefaultConfigId: number): void;

    /**
     * Gets the currently active default configuration ID.
     *
     * @example Get the current default config ID
     * ```typescript
     * const configMgr = env.getConfigManager();
     * const configId = configMgr.getDefaultConfigId();
     * console.log("Default config ID:", configId);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/init-default-config | init-default-config snippet}
     */
    getDefaultConfigId(): number;

    /**
     * Gets information about all registered configuration versions as a JSON string.
     *
     * @example List all registered configurations
     * ```typescript
     * const configMgr = env.getConfigManager();
     * const registry = JSON.parse(configMgr.getConfigRegistry());
     * for (const cfg of registry.CONFIGS) {
     *   console.log(`Config ${cfg.CONFIG_ID}: ${cfg.CONFIG_COMMENTS}`);
     * }
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/register-data-sources | register-data-sources snippet}
     */
    getConfigRegistry(): string;
  }

  interface SzProduct {
    /**
     * Gets the product version information as a JSON string.
     *
     * @example Parse the version info
     * ```typescript
     * const product = env.getProduct();
     * const version = JSON.parse(product.getVersion());
     * console.log(`Senzing ${version.VERSION} (${version.BUILD_DATE})`);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/information/get-version | get-version snippet}
     */
    getVersion(): string;

    /**
     * Gets the product license details as a JSON string.
     *
     * @example Parse the license info
     * ```typescript
     * const product = env.getProduct();
     * const license = JSON.parse(product.getLicense());
     * console.log(`License type: ${license.licenseType}`);
     * console.log(`Expiration: ${license.expireDate}`);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/information/get-license | get-license snippet}
     */
    getLicense(): string;
  }

  interface SzDiagnostic {
    /**
     * Gets detailed feature information by feature ID.
     *
     * @example Get feature details
     * ```typescript
     * const diag = env.getDiagnostic();
     * const feature = JSON.parse(diag.getFeature(1));
     * console.log("Feature:", JSON.stringify(feature, null, 2));
     * ```
     */
    getFeature(featureId: number): string;
    /**
     * Runs a performance benchmark on the repository for the specified duration.
     *
     * @example Run a 3-second benchmark
     * ```typescript
     * const diag = env.getDiagnostic();
     * const result = JSON.parse(diag.checkRepositoryPerformance(3));
     * console.log("Operations/sec:", result.numRecordsInserted / 3);
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/information/check-datastore-performance | check-datastore-performance snippet}
     */
    checkRepositoryPerformance(secondsToRun: number): string;

    /**
     * Purges all entity data from the repository while preserving configuration.
     *
     * @example Purge all data before a fresh load
     * ```typescript
     * const diag = env.getDiagnostic();
     * diag.purgeRepository();
     * console.log("Repository purged");
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/purge-repository | purge-repository snippet}
     */
    purgeRepository(): void;

    /**
     * Gets repository statistics and information as a JSON string.
     *
     * @example Check repository info
     * ```typescript
     * const diag = env.getDiagnostic();
     * const info = JSON.parse(diag.getRepositoryInfo());
     * console.log("Data sources:", JSON.stringify(info.dataStores, null, 2));
     * ```
     *
     * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/information/check-datastore-performance | check-datastore-performance snippet}
     */
    getRepositoryInfo(): string;
  }
}

export {
  SzEngineNative,
  SzConfigManagerNative,
  SzDiagnosticNative,
  SzProductNative,
  SzEnvironmentNative,
} from './js/adapter';
