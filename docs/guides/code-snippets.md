---
title: Code Snippets
group: Guides
category: Reference
---

# Code Snippets

Self-contained TypeScript examples demonstrating every major SDK operation.
Each snippet is runnable via `npx tsx` and covers a single concept with clear,
well-commented code.

## Running Snippets

All snippets live under `code-snippets/` and share a single `package.json`.
Install dependencies once, then run any snippet directly:

```bash
cd code-snippets
npm install

# Run a snippet (SDK snippets require the Senzing runtime)
npx tsx information/get-version/index.ts

# Configtool snippets require a config JSON file as input
npx tsx configtool/basic-usage/index.ts <path-to-config.json>
```

Snippets that require the Senzing runtime will create a temporary SQLite
database, run their demo, and clean up automatically.

---

## Snippet Reference

### Information

Query product and system information.

| Snippet                                                                                                                                   | Description                      | Key APIs                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------- |
| [get-version](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/information/get-version/)                                 | Display Senzing version fields   | `SzProduct.getVersion()`                    |
| [get-license](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/information/get-license/)                                 | Display license details          | `SzProduct.getLicense()`                    |
| [check-datastore-performance](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/information/check-datastore-performance/) | Benchmark repository performance | `SzDiagnostic.checkRepositoryPerformance()` |

### Initialization

Environment lifecycle and setup patterns.

| Snippet                                                                                                                        | Description                                                | Key APIs                                                               |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| [environment-and-hubs](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/environment-and-hubs/) | Access all subsystem interfaces from SzEnvironment         | `getEngine()`, `getConfigManager()`, `getDiagnostic()`, `getProduct()` |
| [engine-priming](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/engine-priming/)             | Pre-load engine caches for faster first queries            | `SzEngine.primeEngine()`                                               |
| [purge-repository](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/purge-repository/)         | Remove all entity data while preserving config             | `SzDiagnostic.purgeRepository()`                                       |
| [lifecycle-patterns](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/initialization/lifecycle-patterns/)     | Proper `try/finally` cleanup, `destroy()`, `isDestroyed()` | `SzEnvironment.destroy()`, `SzEnvironmentDestroyedError`               |

### Configuration

Configuration creation and data source registration.

| Snippet                                                                                                                         | Description                                              | Key APIs                                                      |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| [init-default-config](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/init-default-config/)     | Simplest config setup: create, set default, reinitialize | `createConfig()`, `setDefaultConfig()`                        |
| [register-data-sources](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configuration/register-data-sources/) | Multi-step flow: create, add sources, register, activate | `addDataSource()`, `registerConfig()`, `setDefaultConfigId()` |

### Loading

Record ingestion patterns.

| Snippet                                                                                                         | Description                                               | Key APIs                                     |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------- |
| [load-records](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/loading/load-records/)         | Add records from multiple data sources                    | `SzEngine.addRecord()`                       |
| [load-with-info](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/loading/load-with-info/)     | Batch loading with `WITH_INFO` flag and progress tracking | `addRecord()` with `SzFlags.WITH_INFO`       |
| [load-worker-pool](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/loading/load-worker-pool/) | Parallel loading via `worker_threads` pool                | `worker_threads`, per-worker `SzEnvironment` |

### Searching

Search and analysis operations.

| Snippet                                                                                                               | Description                                       | Key APIs                                 |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| [search-records](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/searching/search-records/)         | Search by attributes, parse match keys and scores | `SzEngine.searchByAttributes()`          |
| [search-worker-pool](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/searching/search-worker-pool/) | Multi-worker search pattern                       | `worker_threads`, `searchByAttributes()` |
| [why-search](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/searching/why-search/)                 | Analyze why entities matched or related           | `whyEntities()`, `whySearch()`           |

### Deleting

Record deletion patterns.

| Snippet                                                                                                      | Description                               | Key APIs                                  |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ----------------------------------------- |
| [delete-records](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/deleting/delete-records/) | Delete individual records, verify removal | `SzEngine.deleteRecord()`                 |
| [delete-loop](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/deleting/delete-loop/)       | Batch deletion with progress tracking     | `deleteRecord()` with `SzFlags.WITH_INFO` |

### Redo

Redo record processing for deferred resolution.

| Snippet                                                                                                      | Description                                            | Key APIs                                                       |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------- |
| [redo-continuous](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/redo/redo-continuous/)   | Process redo records in a continuous loop              | `countRedoRecords()`, `getRedoRecord()`, `processRedoRecord()` |
| [redo-worker-pool](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/redo/redo-worker-pool/) | Multi-worker redo processing                           | `worker_threads`, `processRedoRecord()`                        |
| [load-with-redo](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/redo/load-with-redo/)     | Two-phase: load records, then process all redo records | `addRecord()` then redo loop                                   |
| [redo-with-info](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/redo/redo-with-info/)     | Redo processing with `WITH_INFO` for affected entities | `processRedoRecord()` with `SzFlags.WITH_INFO`                 |

### Error Handling

Error hierarchy and retry patterns.

| Snippet                                                                                                                    | Description                                                     | Key APIs                                                 |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| [error-inspection](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/error-handling/error-inspection/)     | Explore the error class hierarchy, `instanceof`, helper methods | `SzError`, `SzNotFoundError`, `SzUnknownDataSourceError` |
| [retry-with-backoff](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/error-handling/retry-with-backoff/) | Exponential backoff retry for `SzRetryableError`                | `SzRetryableError`, `isRetryable()`                      |

### Stewardship

Advanced entity manipulation and correction.

| Snippet                                                                                                           | Description                                           | Key APIs                                              |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| [force-resolve](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/stewardship/force-resolve/)     | Force two entities to merge via a linking record      | `addRecord()`, `getEntityByRecord()`, `whyEntities()` |
| [force-unresolve](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/stewardship/force-unresolve/) | Separate a merged entity by removing a linking record | `deleteRecord()`, `getEntityByRecord()`               |

### ConfigTool (No Runtime Required)

Offline configuration editing with `@senzing/configtool`.

| Snippet                                                                                                        | Description                                           | Key APIs                                               |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| [basic-usage](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configtool/basic-usage/)       | Add, get, list, delete data sources; inspect features | `addDataSource()`, `getDataSource()`, `listFeatures()` |
| [process-script](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configtool/process-script/) | Apply batch commands via `processScript()`            | `processScript()`, `SzConfigError`                     |

---

## Shared Utilities

All snippets that require the Senzing runtime use a shared helper at
`code-snippets/_utils/snippet-utils.ts`. This helper:

- Detects the platform (macOS vs Linux) and sets paths accordingly
- Creates a fresh SQLite database with the Senzing schema
- Initializes an `SzEnvironment`
- Optionally registers data sources
- Returns a `cleanup()` function for `try/finally` teardown

```typescript
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("my-snippet", ["CUSTOMERS"]);
try {
  const engine = env.getEngine();
  // ... your code here
} finally {
  cleanup();
}
```

---

## Writing New Snippets

1. Create a directory under the appropriate category: `code-snippets/<category>/<name>/`
2. Add an `index.ts` file with a JSDoc comment explaining the snippet
3. Use `initSnippetEnvironment()` for boilerplate (or set up manually if the snippet demonstrates initialization itself)
4. Always use `try/finally` with `cleanup()` to ensure resources are released
5. Add the snippet to the CI workflow in `.github/workflows/ci.yml`
6. Update this documentation page
