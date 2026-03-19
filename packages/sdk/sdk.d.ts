export {
  SzConfigManager,
  SzDiagnostic,
  SzEnvironment,
  SzProduct,
  FlagEntry,
  RecordKey,
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/initialization/environment-and-hubs | environment-and-hubs snippet}
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/initialization/lifecycle-patterns | lifecycle-patterns snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/initialization/lifecycle-patterns | lifecycle-patterns snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/initialization/lifecycle-patterns | lifecycle-patterns snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/configuration/register-data-sources | register-data-sources snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/configuration/init-default-config | init-default-config snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/initialization/environment-and-hubs | environment-and-hubs snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/configuration/init-default-config | init-default-config snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/initialization/environment-and-hubs | environment-and-hubs snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/information/get-version | get-version snippet}
     */
    getProduct(): SzProductWrapper;
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/loading/load-records | load-records snippet}
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/loading/load-with-info | load-with-info snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/deleting/delete-records | delete-records snippet}
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/deleting/delete-loop | delete-loop snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/searching/search-records | search-records snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/loading/load-with-info | load-with-info snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/searching/search-records | search-records snippet}
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/searching/search-worker-pool | search-worker-pool snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/searching/why-search | why-search snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/searching/why-search | why-search snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/loading/load-records | load-records snippet}
     */
    exportJsonEntityReport(flags?: bigint | undefined | null): SzExportIterator;

    /**
     * Starts a CSV entity export. Returns an SzExportIterator.
     *
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/loading/load-records | load-records snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/redo/redo-continuous | redo-continuous snippet}
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/redo/load-with-redo | load-with-redo snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/redo/redo-continuous | redo-continuous snippet}
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/redo/redo-with-info | redo-with-info snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/redo/redo-with-info | redo-with-info snippet}
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/redo/redo-worker-pool | redo-worker-pool snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/initialization/engine-priming | engine-priming snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/initialization/engine-priming | engine-priming snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/stewardship/force-resolve | force-resolve snippet}
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/stewardship/force-unresolve | force-unresolve snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/searching/search-records | search-records snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/searching/search-records | search-records snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/configuration/init-default-config | init-default-config snippet}
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/configuration/register-data-sources | register-data-sources snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/configuration/init-default-config | init-default-config snippet}
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/configuration/register-data-sources | register-data-sources snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/configuration/register-data-sources | register-data-sources snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/configuration/init-default-config | init-default-config snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/configuration/register-data-sources | register-data-sources snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/configuration/init-default-config | init-default-config snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/configuration/register-data-sources | register-data-sources snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/information/get-version | get-version snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/information/get-license | get-license snippet}
     */
    getLicense(): string;
  }

  interface SzDiagnostic {
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/information/check-datastore-performance | check-datastore-performance snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/initialization/purge-repository | purge-repository snippet}
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
     * @see {@link https://github.com/senzing-garage/sz-napi/tree/main/code-snippets/information/check-datastore-performance | check-datastore-performance snippet}
     */
    getRepositoryInfo(): string;
  }
}
