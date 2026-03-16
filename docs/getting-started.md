# Getting Started: Zero to First Entity

This guide walks you through installing the Senzing runtime, setting up a SQLite
repository, loading records, and resolving your first entity using the
`@senzing/sdk` Node.js/TypeScript SDK.

## 1. Install the Senzing Runtime

The SDK is a thin NAPI-RS bridge. The entity resolution engine, support data,
and configuration templates are distributed as a separate platform package.

**macOS (arm64):**

```bash
brew install senzingsdk-runtime-unofficial
export DYLD_LIBRARY_PATH=/opt/homebrew/opt/senzing/runtime/er/lib
```

Add the `export` line to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.) so
it persists across sessions.

**Linux (x64, arm64):**

```bash
# Debian/Ubuntu
apt install senzingsdk-runtime

# RHEL/CentOS
yum install senzingsdk-runtime

export LD_LIBRARY_PATH=/opt/senzing/er/lib
```

**Windows (x64):**

```powershell
scoop install senzingsdk-runtime-unofficial
# The installer adds Sz.dll to your PATH automatically.
```

## 2. Install the SDK

```bash
npm install @senzing/sdk
```

npm installs only the prebuilt binary for your OS and architecture. No Rust
toolchain required for normal use.

### Building from Source

```bash
# Clone the repo and its Rust dependency
git clone https://github.com/senzing-garage/sz-napi
cd sz-napi

# Build the Rust workspace
cargo build --workspace

# Build the NAPI module for your platform
cd packages/sdk && npx napi build --platform
```

## 3. Configure a SQLite Database

Create a settings object that points to the Senzing installation paths and a
SQLite connection string. Senzing auto-initializes the database file on first
use — no separate schema step needed.

```typescript
const settings = JSON.stringify({
  PIPELINE: {
    CONFIGPATH: "/opt/senzing/er/resources/templates",
    RESOURCEPATH: "/opt/senzing/er/resources",
    SUPPORTPATH: "/opt/senzing/data",
  },
  SQL: {
    CONNECTION: "sqlite3://na:na@/tmp/my-senzing.db",
  },
});
```

Adjust paths for your platform:

| Platform     | Typical base path                      |
| ------------ | -------------------------------------- |
| macOS (brew) | `/opt/homebrew/opt/senzing/runtime/er` |
| Linux        | `/opt/senzing/er`                      |
| Windows      | `C:\ProgramData\Senzing\er`            |

## 4. Create an SzEnvironment

`SzEnvironment` is the entry point. It initialises the engine and exposes
accessor methods for each subsystem.

```typescript
import { SzEnvironment, SzFlags } from "@senzing/sdk";

const env = new SzEnvironment(
  "my-app", // module name — shows up in logs
  settings, // JSON string from step 3
  false, // verbose logging (optional, defaults to false)
);
```

Always wrap usage in a `try/finally` block so `env.destroy()` is called even
if an error is thrown.

## 5. Register Data Sources and Add Records

Data sources must exist in the active configuration before records can be
loaded. If you are starting from an empty database, create a config from the
built-in template, add your data sources with `@senzing/configtool`, register
it, and reinitialize.

```typescript
import { addDataSource } from "@senzing/configtool";

const configManager = env.getConfigManager();

// Create a config from the built-in template
let configJson = configManager.createConfig();

// Add data sources (stateless: each call returns a new JSON string)
configJson = addDataSource(configJson, { code: "CUSTOMERS" });
configJson = addDataSource(configJson, { code: "WATCHLIST" });

// Register, activate, and reload
const configId = configManager.setDefaultConfig(
  configJson,
  "Initial data sources",
);
env.reinitialize(configId);
```

Now add records. `SzFlags` values are `bigint`. Pass `SzFlags.WITH_INFO` to
receive entity resolution details (affected entities, relationships) back as a
JSON string.

```typescript
const engine = env.getEngine();

const robert = JSON.stringify({
  NAME_FULL: "Robert Smith",
  DATE_OF_BIRTH: "1985-02-15",
  ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
  SSN_NUMBER: "111-22-3333",
});

const bob = JSON.stringify({
  NAME_FULL: "Bob J Smith",
  DATE_OF_BIRTH: "2/15/1985",
  ADDR_FULL: "123 Main Street, Las Vegas, NV 89101",
  PHONE_NUMBER: "702-555-1212",
});

// Add with WITH_INFO to see which entity the record landed in
const info = engine.addRecord("CUSTOMERS", "1001", robert, SzFlags.WITH_INFO);
console.log("Resolution info:", JSON.parse(info));

// Add without info when you don't need the response
engine.addRecord("WATCHLIST", "W100", bob, SzFlags.NO_FLAGS);
```

Common attribute names: `NAME_FULL`, `NAME_FIRST` / `NAME_LAST`,
`DATE_OF_BIRTH`, `ADDR_FULL`, `PHONE_NUMBER`, `EMAIL_ADDRESS`,
`SSN_NUMBER`, `DRIVERS_LICENSE_NUMBER`.

## 6. Search by Attributes

Search for entities that match a set of attributes. Results are ranked by
match quality.

```typescript
const searchResult = engine.searchByAttributes(
  JSON.stringify({
    NAME_FULL: "Bob Smith",
    ADDR_FULL: "123 Main St, Las Vegas",
  }),
  undefined, // search profile (use default)
  SzFlags.SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS,
);

const results = JSON.parse(searchResult);
for (const match of results.RESOLVED_ENTITIES ?? []) {
  const entityId = match.ENTITY.RESOLVED_ENTITY.ENTITY_ID;
  const matchKey = match.MATCH_INFO.MATCH_KEY;
  console.log(`Entity ${entityId} — match key: ${matchKey}`);
}
```

## 7. Retrieve an Entity

**By record key** — look up the entity that contains a specific record:

```typescript
const entityJson = engine.getEntityByRecord(
  "CUSTOMERS",
  "1001",
  SzFlags.ENTITY_DEFAULT_FLAGS,
);
const entity = JSON.parse(entityJson);
const entityId: number = entity.RESOLVED_ENTITY.ENTITY_ID;
console.log(`Entity ID: ${entityId}`);
console.log(`Records:   ${entity.RESOLVED_ENTITY.RECORDS?.length}`);
```

**By entity ID** — retrieve an entity directly once you know its ID:

```typescript
const byId = engine.getEntityById(entityId, SzFlags.ENTITY_DEFAULT_FLAGS);
console.log(JSON.parse(byId).RESOLVED_ENTITY.ENTITY_NAME);
```

## 8. Export All Entities

Iterate over every resolved entity using the handle-based export API.
`fetchNext` returns one JSON object per call and returns an empty string when
the export is exhausted.

```typescript
const exportHandle = engine.exportJsonEntityReport(
  SzFlags.EXPORT_DEFAULT_FLAGS,
);

try {
  let chunk: string;
  while ((chunk = engine.fetchNext(exportHandle)) !== "") {
    const entity = JSON.parse(chunk);
    console.log(entity.RESOLVED_ENTITY.ENTITY_ID);
  }
} finally {
  // Always close the handle to free native resources
  engine.closeExport(exportHandle);
}
```

For a CSV export use `exportCsvEntityReport(columnList, flags)` with the same
`fetchNext` / `closeExport` pattern.

## 9. Cleanup

```typescript
env.destroy();
```

After `destroy()` the `SzEnvironment` instance is no longer usable. Attempting
to call any method on it or on objects obtained from it (engine, configManager,
etc.) will throw `SzEnvironmentDestroyedError`.

## Putting It All Together

```typescript
import { SzEnvironment, SzFlags, SzError } from "@senzing/sdk";
import { addDataSource } from "@senzing/configtool";

const settings = JSON.stringify({
  PIPELINE: {
    CONFIGPATH: "/opt/senzing/er/resources/templates",
    RESOURCEPATH: "/opt/senzing/er/resources",
    SUPPORTPATH: "/opt/senzing/data",
  },
  SQL: { CONNECTION: "sqlite3://na:na@/tmp/my-senzing.db" },
});

const env = new SzEnvironment("my-app", settings);

try {
  // Bootstrap config with data sources
  const cm = env.getConfigManager();
  let cfg = cm.createConfig();
  cfg = addDataSource(cfg, { code: "CUSTOMERS" });
  cfg = addDataSource(cfg, { code: "WATCHLIST" });
  env.reinitialize(cm.setDefaultConfig(cfg, "bootstrap"));

  const engine = env.getEngine();

  // Load records
  engine.addRecord(
    "CUSTOMERS",
    "1001",
    JSON.stringify({
      NAME_FULL: "Robert Smith",
      DATE_OF_BIRTH: "1985-02-15",
      ADDR_FULL: "123 Main St, Las Vegas, NV 89101",
    }),
    SzFlags.WITH_INFO,
  );
  engine.addRecord(
    "WATCHLIST",
    "W100",
    JSON.stringify({
      NAME_FULL: "Bob J Smith",
      DATE_OF_BIRTH: "2/15/1985",
      ADDR_FULL: "123 Main Street, Las Vegas, NV 89101",
    }),
    SzFlags.NO_FLAGS,
  );

  // Resolve
  const entityJson = engine.getEntityByRecord(
    "CUSTOMERS",
    "1001",
    SzFlags.ENTITY_DEFAULT_FLAGS,
  );
  const entityId = JSON.parse(entityJson).RESOLVED_ENTITY.ENTITY_ID;
  console.log("Resolved entity ID:", entityId);

  // Search
  const found = JSON.parse(
    engine.searchByAttributes(
      JSON.stringify({ NAME_FULL: "Bob Smith" }),
      undefined,
      SzFlags.SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS,
    ),
  );
  console.log("Search hits:", found.RESOLVED_ENTITIES?.length);

  // Export
  const handle = engine.exportJsonEntityReport(SzFlags.EXPORT_DEFAULT_FLAGS);
  try {
    let chunk: string;
    let count = 0;
    while ((chunk = engine.fetchNext(handle)) !== "") count++;
    console.log("Total entities:", count);
  } finally {
    engine.closeExport(handle);
  }
} catch (e) {
  if (e instanceof SzError) console.error("Senzing error:", e.message);
  else throw e;
} finally {
  env.destroy();
}
```

## Next Steps

- **Full API reference** — see [README.md](../README.md)
- **SzFlags** — all flag constants are `bigint` values; combine with `|`
  (`SzFlags.ENTITY_DEFAULT_FLAGS | SzFlags.ENTITY_INCLUDE_ALL_FEATURES`)
- **Config management** — `@senzing/configtool` lets you modify configuration
  JSON offline without a running engine; see `examples/config-management.ts`
- **Worker threads** — for high-throughput workloads see
  `examples/electron-worker.ts`
- **Error handling** — errors map to a class hierarchy; see the Error Handling
  section of README.md for the full tree and `instanceof` examples
