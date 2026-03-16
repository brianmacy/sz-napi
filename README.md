# sz-napi

Node.js/TypeScript SDK for Senzing v4 entity resolution, built with NAPI-RS.

[![CI](https://github.com/brianmacy/sz-napi/actions/workflows/ci.yml/badge.svg)](https://github.com/brianmacy/sz-napi/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

## Overview

This monorepo provides two npm packages:

- **`@senzing/sdk`** -- Runtime bindings for the Senzing entity resolution engine. Add records, resolve entities, search by attributes, analyze relationships, and manage configurations.
- **`@senzing/configtool`** -- Pure JSON manipulation of Senzing configuration documents. No Senzing runtime needed. Works anywhere Node.js runs.

Both packages are built with [NAPI-RS](https://napi.rs) (Rust native bindings), providing full TypeScript type definitions generated from Rust source code and prebuilt native binaries for all supported platforms.

## Prerequisites

### Node.js

Node.js 18 or later.

### Senzing Runtime (for @senzing/sdk only)

The `@senzing/sdk` package requires the Senzing runtime to be installed separately. The npm package contains only the NAPI bridge code (a few MB); the runtime libraries and support data are installed via platform package managers.

**macOS (arm64):**

```bash
brew install senzingsdk-runtime-unofficial
export DYLD_LIBRARY_PATH=/opt/homebrew/opt/senzing/runtime/er/lib
```

**Linux (x64, arm64):**

```bash
# Debian/Ubuntu
apt install senzingsdk-runtime

# RHEL/CentOS
yum install senzingsdk-runtime

export LD_LIBRARY_PATH=/opt/senzing/er/lib
```

**Windows (x64):**

```bash
scoop install senzingsdk-runtime-unofficial
# Ensure Sz.dll is on your PATH
```

**`@senzing/configtool` has no Senzing runtime dependency.** It works anywhere Node.js runs without installing Senzing.

## Installation

```bash
npm install @senzing/sdk
npm install @senzing/configtool
```

Each package uses platform-specific optional dependencies so npm installs only the binary for your OS and architecture.

## Quick Start

### SDK: Add Records and Search

```typescript
import { SzEnvironment, SzFlags } from "@senzing/sdk";

const settings = JSON.stringify({
  PIPELINE: {
    CONFIGPATH: "/opt/senzing/er/resources/templates",
    RESOURCEPATH: "/opt/senzing/er/resources",
    SUPPORTPATH: "/opt/senzing/data",
  },
  SQL: {
    CONNECTION: "sqlite3://na:na@/tmp/senzing.db",
  },
});

const env = new SzEnvironment("my-app", settings);
const engine = env.getEngine();

// Add a record
engine.addRecord(
  "CUSTOMERS",
  "1001",
  JSON.stringify({ NAME_FULL: "Robert Smith", DATE_OF_BIRTH: "1985-02-15" }),
);

// Search by attributes
const result = engine.searchByAttributes(
  JSON.stringify({ NAME_FULL: "Bob Smith" }),
  undefined,
  SzFlags.SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS,
);
console.log(JSON.parse(result));

// Cleanup
env.destroy();
```

### ConfigTool: Edit Configuration Offline

```typescript
import { readFileSync, writeFileSync } from "node:fs";
import { addDataSource, listDataSources } from "@senzing/configtool";

// Load a config JSON (from createConfig() or a saved file)
let config = readFileSync("config.json", "utf-8");

// Add data sources
config = addDataSource(config, { code: "CUSTOMERS" });
config = addDataSource(config, { code: "WATCHLIST" });

// List all data sources
const sources = JSON.parse(listDataSources(config));
console.log(sources);

// Save the modified config
writeFileSync("config-modified.json", config);
```

## API Reference

### @senzing/sdk

| Export                     | Description                                                                                                                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SzEnvironment`            | Lifecycle management. Constructor takes module name, settings JSON, and optional verbose logging flag. Provides `getEngine()`, `getConfigManager()`, `getDiagnostic()`, `getProduct()`, `destroy()`, and `reinitialize()`. |
| `SzEngine`                 | Entity resolution operations: `addRecord`, `deleteRecord`, `getEntityById`, `getEntityByRecord`, `searchByAttributes`, `whyEntities`, `whyRecords`, `howEntity`, `findPath`, `findNetwork`, export iteration, and more.    |
| `SzConfigManager`          | Configuration management: `createConfig`, `registerConfig`, `setDefaultConfig`, `replaceDefaultConfigId`, `getConfigRegistry`, and more.                                                                                   |
| `SzDiagnostic`             | System diagnostics: `checkRepositoryPerformance`, `getRepositoryInfo`, `getFeature`, `purgeRepository`.                                                                                                                    |
| `SzProduct`                | Product info: `getVersion`, `getLicense`.                                                                                                                                                                                  |
| `SzFlags`                  | Frozen object containing all flag constants as `bigint` values.                                                                                                                                                            |
| `SzError` (and subclasses) | Error hierarchy for structured error handling.                                                                                                                                                                             |

Full type definitions are in `packages/sdk/sdk.d.ts`.

### @senzing/configtool

All functions are stateless: they accept a config JSON string and return a modified config JSON string (or query results as a JSON string).

| Category           | Functions                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Data Sources       | `addDataSource`, `setDataSource`, `getDataSource`, `deleteDataSource`, `listDataSources`                                     |
| Attributes         | `addAttribute`, `setAttribute`, `getAttribute`, `deleteAttribute`, `listAttributes`                                          |
| Features           | `addFeature`, `setFeature`, `getFeature`, `deleteFeature`, `listFeatures`                                                    |
| Elements           | `addElement`, `setElement`, `getElement`, `deleteElement`, `listElements`                                                    |
| Rules              | `addRule`, `setRule`, `getRule`, `deleteRule`, `listRules`                                                                   |
| Fragments          | `addFragment`, `setFragment`, `getFragment`, `deleteFragment`, `listFragments`                                               |
| Functions          | Standardize, expression, comparison, distinct, matching, scoring, candidate, validation -- each with add/set/get/delete/list |
| Calls              | Standardize, expression, comparison, distinct calls -- each with add/set/get/delete/list                                     |
| Thresholds         | `addComparisonThreshold`, `setComparisonThreshold`, `deleteComparisonThreshold`, `listComparisonThresholds`                  |
| Behavior Overrides | `addBehaviorOverride`, `deleteBehaviorOverride`, `getBehaviorOverride`, `listBehaviorOverrides`                              |
| Generic Plans      | `cloneGenericPlan`, `deleteGenericPlan`, `setGenericPlan`, `listGenericPlans`                                                |
| System Params      | `listSystemParameters`, `setSystemParameter`                                                                                 |
| Config Sections    | `addConfigSection`, `removeConfigSection`, `getConfigSection`, `listConfigSections`                                          |
| Versioning         | `getVersion`, `getCompatibilityVersion`, `updateCompatibilityVersion`, `verifyCompatibilityVersion`                          |
| Script Processing  | `processScript`, `processFile`                                                                                               |

Full type definitions are in `packages/configtool/index.d.ts`.

## SzFlags

Flag constants are `bigint` values because the `WITH_INFO` flag occupies bit 62 (`1n << 62n`), which exceeds `Number.MAX_SAFE_INTEGER`. Using `bigint` uniformly avoids mixing numeric types and is future-proof for additional high-bit flags.

```typescript
import { SzFlags } from "@senzing/sdk";

// Use a predefined composite flag
engine.addRecord("DS", "1", record, SzFlags.ADD_RECORD_ALL_FLAGS);

// Combine flags with bitwise OR
engine.getEntityByRecord(
  "DS",
  "1",
  SzFlags.ENTITY_DEFAULT_FLAGS | SzFlags.ENTITY_INCLUDE_ALL_FEATURES,
);

// No flags
engine.deleteRecord("DS", "1", SzFlags.NO_FLAGS);
```

Common composite flags include `ENTITY_DEFAULT_FLAGS`, `SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS`, `EXPORT_DEFAULT_FLAGS`, `WHY_ENTITIES_DEFAULT_FLAGS`, and more. See the type definitions for the complete list.

## Error Handling

### @senzing/sdk

Errors are mapped to a class hierarchy for `instanceof` filtering:

```typescript
import {
  SzError,
  SzBadInputError,
  SzNotFoundError,
  SzRetryableError,
  SzUnknownDataSourceError,
} from "@senzing/sdk";

try {
  engine.addRecord("UNKNOWN_DS", "1", record);
} catch (e) {
  if (e instanceof SzNotFoundError) {
    // Record or entity not found
  } else if (e instanceof SzUnknownDataSourceError) {
    // Data source does not exist in the config
  } else if (e instanceof SzBadInputError) {
    // Catches all bad input errors (parent of NotFound, UnknownDataSource)
  } else if (e instanceof SzRetryableError) {
    // Transient errors that may succeed on retry
  } else if (e instanceof SzError) {
    // Base class -- check category helpers
    console.log(e.isRetryable(), e.isBadInput(), e.isDatabase());
  }
}
```

**Error hierarchy:**

```
SzError
  +-- SzBadInputError
  |     +-- SzNotFoundError
  |     +-- SzUnknownDataSourceError
  +-- SzConfigurationError
  +-- SzRetryableError
  |     +-- SzDatabaseConnectionLostError
  |     +-- SzDatabaseTransientError
  |     +-- SzRetryTimeoutExceededError
  +-- SzUnrecoverableError
  |     +-- SzDatabaseError
  |     +-- SzLicenseError
  |     +-- SzNotInitializedError
  |     +-- SzUnhandledError
  +-- SzReplaceConflictError
  +-- SzEnvironmentDestroyedError
```

### @senzing/configtool

```typescript
import { SzConfigError } from "@senzing/configtool";

try {
  addDataSource(config, { code: "DUPLICATE" });
} catch (e) {
  if (e instanceof SzConfigError) {
    console.log(e.errorType); // 'AlreadyExists', 'NotFound', 'InvalidInput', etc.
  }
}
```

## Platform Support

| Platform | Architecture | @senzing/sdk | @senzing/configtool |
| -------- | ------------ | :----------: | :-----------------: |
| macOS    | arm64        |     Yes      |         Yes         |
| Linux    | x64          |     Yes      |         Yes         |
| Linux    | arm64        |     Yes      |         Yes         |
| Windows  | x64          |     Yes      |         Yes         |

macOS x86_64 (Intel) is not supported by the Senzing v4 runtime.

## Thread Safety

The Senzing engine is thread-safe. Multiple engine calls can be in-flight simultaneously across libuv worker threads without external synchronization. NAPI-RS automatically schedules synchronous Rust functions on the libuv thread pool so they do not block the Node.js event loop.

For heavy workloads in Electron or Node.js, use `worker_threads` with a separate `SzEnvironment` per worker:

```typescript
import { Worker } from "worker_threads";

const worker = new Worker("./worker.js", {
  workerData: { settings },
});
```

See [examples/electron-worker/](examples/electron-worker/) for the complete pattern.

## Building from Source

### Prerequisites

- Rust toolchain (edition 2024, MSRV 1.88)
- Node.js 18+
- The Senzing runtime (for @senzing/sdk builds)

### Build

```bash
# Build the Rust workspace
cargo build --workspace

# Build the SDK native module
cd packages/sdk && npx napi build --platform
cd ../..

# Build the configtool native module
cd packages/configtool && npx napi build --platform
cd ../..
```

### Test

```bash
# Run all tests (SDK tests require Senzing runtime)
npm test

# Run only configtool tests (no runtime needed)
cd packages/configtool && npx vitest run
```

## Documentation

- [Getting Started](docs/getting-started.md) — Zero-to-first-entity walkthrough
- [Config Management](docs/config-management.md) — Configuration lifecycle tutorial
- [Error Handling](docs/error-handling.md) — Error hierarchy and patterns
- [Deployment](docs/deployment.md) — Docker, PostgreSQL, monitoring

## Examples

Each example is a self-contained project with its own `package.json`:

```bash
cd examples/basic-sdk-usage
npm install
npm start
```

| Example                                          | Description                                    | Requires Runtime |
| ------------------------------------------------ | ---------------------------------------------- | :--------------: |
| [basic-sdk-usage](examples/basic-sdk-usage/)     | Add records, search, entity resolution, export |       Yes        |
| [config-management](examples/config-management/) | Create, modify, register, and activate configs |       Yes        |
| [configtool-usage](examples/configtool-usage/)   | Offline config editing with pure JSON          |        No        |
| [electron-worker](examples/electron-worker/)     | Worker thread pattern for Electron apps        |       Yes        |

## Repository Structure

```
sz-napi/
  Cargo.toml                    # Workspace root
  package.json                  # npm workspace root
  README.md
  packages/
    sdk/                        # @senzing/sdk
      Cargo.toml                # napi-rs crate, depends on sz-rust-sdk
      package.json
      sdk.js                    # Entry point with error wrapping
      sdk.d.ts                  # TypeScript definitions
      src/                      # Rust source
      js/                       # JS error hierarchy and wrapper
      npm/                      # Platform-specific packages
      __tests__/
    configtool/                 # @senzing/configtool
      Cargo.toml                # napi-rs crate, depends on sz_configtool_lib
      package.json
      configtool.js             # Entry point with error wrapping
      index.d.ts                # TypeScript definitions
      src/                      # Rust source
      js/                       # JS error mapping and wrapper
      npm/                      # Platform-specific packages
      __tests__/
  examples/
    basic-sdk-usage/            # Load records, search, get entities
    config-management/          # Register data sources, manage configs
    configtool-usage/           # Edit config JSON offline
    electron-worker/            # Worker thread pattern for Electron
  docs/
    getting-started.md          # Zero-to-first-entity walkthrough
    config-management.md        # Configuration lifecycle tutorial
    error-handling.md           # Error hierarchy and patterns
    deployment.md               # Docker, PostgreSQL, monitoring
```

## License

[Apache-2.0](LICENSE)
