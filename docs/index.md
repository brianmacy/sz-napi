---
title: Home
---

# Senzing Node.js SDK

Node.js/TypeScript bindings for [Senzing](https://senzing.com) v4 entity resolution, built with NAPI-RS.

## Packages

| Package                 | Description                                                                                                            | Runtime Required |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- | :--------------: |
| **@senzing/sdk**        | Entity resolution engine bindings: add records, resolve entities, search, analyze relationships, manage configurations |       Yes        |
| **@senzing/configtool** | Pure JSON manipulation of Senzing configuration documents. Works anywhere Node.js runs.                                |        No        |

## Quick Start

```bash
npm install @senzing/sdk @senzing/configtool
```

```typescript
import { SzEnvironment, SzFlags } from "@senzing/sdk";
import { addDataSource } from "@senzing/configtool";

const settings = JSON.stringify({
  PIPELINE: {
    CONFIGPATH: "/opt/senzing/er/resources/templates",
    RESOURCEPATH: "/opt/senzing/er/resources",
    SUPPORTPATH: "/opt/senzing/data",
  },
  SQL: { CONNECTION: "sqlite3://na:na@/tmp/senzing.db" },
});

const env = new SzEnvironment("my-app", settings);

try {
  // Bootstrap configuration with data sources
  const cm = env.getConfigManager();
  let cfg = cm.createConfig();
  cfg = addDataSource(cfg, { code: "CUSTOMERS" });
  env.reinitialize(cm.setDefaultConfig(cfg, "Initial config"));

  // Add and resolve records
  const engine = env.getEngine();
  engine.addRecord(
    "CUSTOMERS",
    "1001",
    JSON.stringify({ NAME_FULL: "Robert Smith", DATE_OF_BIRTH: "1985-02-15" }),
    SzFlags.WITH_INFO,
  );

  // Search by attributes
  const result = engine.searchByAttributes(
    JSON.stringify({ NAME_FULL: "Bob Smith" }),
    undefined,
    SzFlags.SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS,
  );
  console.log(JSON.parse(result));
} finally {
  env.destroy();
}
```

## Guides

- **[Getting Started](documents/Getting_Started.html)** -- Install the runtime, create your first entity
- **[Configuration Lifecycle](documents/Configuration_Lifecycle.html)** -- Create, edit, register, and activate configs
- **[Error Handling](documents/Error_Handling.html)** -- Error hierarchy, instanceof patterns, retry logic
- **[Deployment](documents/Deployment.html)** -- Docker, PostgreSQL, monitoring, worker threads
- **[Code Snippets](documents/Code_Snippets.html)** -- 27 runnable examples covering every SDK operation

## API Reference

Browse the full API reference using the sidebar navigation:

- **SzEnvironment** -- Lifecycle management, subsystem access
- **SzEngine** -- Record operations, entity resolution, search, export
- **SzConfigManager** -- Configuration management
- **SzDiagnostic** -- Performance benchmarks, repository management
- **SzProduct** -- Version and license information
- **SzFlags** -- Flag constants (bigint values)
- **SzError** -- Structured error hierarchy

## Platform Support

| Platform | Architecture | @senzing/sdk | @senzing/configtool |
| -------- | ------------ | :----------: | :-----------------: |
| macOS    | arm64        |     Yes      |         Yes         |
| Linux    | x64          |     Yes      |         Yes         |
| Linux    | arm64        |     Yes      |         Yes         |
| Windows  | x64          |     Yes      |         Yes         |

## Examples and Code Snippets

The repository includes [6 full examples](https://github.com/senzing-garage/sz-napi/tree/main/examples) and [27 focused code snippets](https://github.com/senzing-garage/sz-napi/tree/main/code-snippets) covering:

| Category       | Topics                                         |
| -------------- | ---------------------------------------------- |
| Information    | Version, license, performance benchmarks       |
| Initialization | Environment lifecycle, engine priming, purge   |
| Configuration  | Config creation, data source registration      |
| Loading        | Single records, batch with info, worker pools  |
| Searching      | Attribute search, why analysis, worker pools   |
| Deleting       | Single delete, batch deletion                  |
| Redo           | Continuous processing, worker pools, with info |
| Error Handling | Error inspection, retry with backoff           |
| Stewardship    | Force resolve, force unresolve                 |
| ConfigTool     | Offline editing, batch scripts                 |
