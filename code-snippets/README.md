# Code Snippets

Focused, runnable TypeScript examples for every Senzing SDK operation category.

## Quick Start

```bash
npm install
npx tsx information/get-version/index.ts
```

SDK snippets require the [Senzing runtime](../README.md#prerequisites).
ConfigTool snippets work without any runtime.

## Snippets

| Category           | Snippet                                                                 | Description                                   | Runtime? |
| ------------------ | ----------------------------------------------------------------------- | --------------------------------------------- | :------: |
| **Information**    | [get-version](information/get-version/)                                 | Display version fields                        |   Yes    |
|                    | [get-license](information/get-license/)                                 | Display license details                       |   Yes    |
|                    | [check-datastore-performance](information/check-datastore-performance/) | Benchmark repository                          |   Yes    |
| **Initialization** | [environment-and-hubs](initialization/environment-and-hubs/)            | Access all subsystem interfaces               |   Yes    |
|                    | [engine-priming](initialization/engine-priming/)                        | Pre-load engine caches                        |   Yes    |
|                    | [purge-repository](initialization/purge-repository/)                    | Remove all entity data                        |   Yes    |
|                    | [lifecycle-patterns](initialization/lifecycle-patterns/)                | try/finally cleanup, destroy(), isDestroyed() |   Yes    |
| **Configuration**  | [init-default-config](configuration/init-default-config/)               | Simplest config setup                         |   Yes    |
|                    | [register-data-sources](configuration/register-data-sources/)           | Multi-step config registration                |   Yes    |
| **Loading**        | [load-records](loading/load-records/)                                   | Add records from multiple sources             |   Yes    |
|                    | [load-with-info](loading/load-with-info/)                               | Batch loading with WITH_INFO                  |   Yes    |
|                    | [load-worker-pool](loading/load-worker-pool/)                           | Parallel loading via worker_threads           |   Yes    |
| **Searching**      | [search-records](searching/search-records/)                             | Search by attributes                          |   Yes    |
|                    | [search-worker-pool](searching/search-worker-pool/)                     | Multi-worker search                           |   Yes    |
|                    | [why-search](searching/why-search/)                                     | Analyze why entities matched                  |   Yes    |
| **Deleting**       | [delete-records](deleting/delete-records/)                              | Delete individual records                     |   Yes    |
|                    | [delete-loop](deleting/delete-loop/)                                    | Batch deletion with progress                  |   Yes    |
| **Redo**           | [redo-continuous](redo/redo-continuous/)                                | Continuous redo processing loop               |   Yes    |
|                    | [redo-worker-pool](redo/redo-worker-pool/)                              | Multi-worker redo processing                  |   Yes    |
|                    | [load-with-redo](redo/load-with-redo/)                                  | Load then process redo                        |   Yes    |
|                    | [redo-with-info](redo/redo-with-info/)                                  | Redo with WITH_INFO flag                      |   Yes    |
| **Error Handling** | [error-inspection](error-handling/error-inspection/)                    | Error hierarchy and instanceof                |   Yes    |
|                    | [retry-with-backoff](error-handling/retry-with-backoff/)                | Exponential backoff for retryable errors      |   Yes    |
| **Stewardship**    | [force-resolve](stewardship/force-resolve/)                             | Force-merge entities via linking record       |   Yes    |
|                    | [force-unresolve](stewardship/force-unresolve/)                         | Separate entities by removing link            |   Yes    |
| **ConfigTool**     | [basic-usage](configtool/basic-usage/)                                  | Add/get/list/delete data sources              |    No    |
|                    | [process-script](configtool/process-script/)                            | Batch commands via processScript()            |    No    |

ConfigTool snippets require a config JSON file argument:

```bash
npx tsx configtool/basic-usage/index.ts <path-to-config.json>
```

## Shared Utilities

All SDK snippets use `_utils/snippet-utils.ts` which handles platform
detection, database creation, environment setup, and cleanup.

See [docs/code-snippets.md](../docs/code-snippets.md) for the full reference.
