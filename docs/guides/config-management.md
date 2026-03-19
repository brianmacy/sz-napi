---
title: Configuration Lifecycle
group: Guides
category: Tutorials
---

# Senzing Configuration Lifecycle

This tutorial walks through the full Senzing configuration lifecycle using
`@senzing/sdk` and `@senzing/configtool`. You will learn how to create a
configuration template, edit it without a running runtime, register and
activate it safely in a concurrent environment, and reinitialize a live
engine to pick up the new configuration.

## Overview

Senzing configuration is stored as a JSON document. The document describes
every data source, feature type, attribute mapping, resolution rule, and
scoring threshold the engine uses. Two packages share responsibility for
managing this document:

- **`@senzing/sdk`** — provides `SzEnvironment`, which exposes
  `SzConfigManager`. The config manager talks to the live Senzing database:
  it stores configs in the registry, reads which config is currently active,
  and swaps the active config atomically. It requires a running Senzing
  environment.

- **`@senzing/configtool`** — provides a set of pure functions that read and
  write a config JSON string. It has no dependency on the Senzing native
  library and can be used in offline tools, CI pipelines, and build scripts.

The typical workflow is:

1. Obtain a config JSON template from `SzConfigManager.createConfig()`.
2. Edit the JSON with `@senzing/configtool` functions.
3. Register the edited JSON with `SzConfigManager.registerConfig()`.
4. Activate the new config with `replaceDefaultConfigId()` or
   `setDefaultConfig()`.
5. Call `SzEnvironment.reinitialize()` so the running engine picks up the
   change.

---

## 1. Setting Up the Environment

```typescript
import { SzEnvironment } from "@senzing/sdk";

const settings = JSON.stringify({
  PIPELINE: {
    CONFIGPATH: "/opt/senzing/er/resources/templates",
    RESOURCEPATH: "/opt/senzing/er/resources",
    SUPPORTPATH: "/opt/senzing/data",
  },
  SQL: { CONNECTION: "sqlite3://na:na@/var/lib/senzing/sz.db" },
});

const env = new SzEnvironment("my-app", settings);
const configManager = env.getConfigManager();
```

---

## 2. Create a Config Template

`createConfig()` returns the default Senzing config template as a JSON
string. This template contains all built-in features, attributes, and rules.
It does not yet include any of your application's data sources.

```typescript
// Returns the full default config JSON as a string.
const configJson: string = configManager.createConfig();
```

You can also obtain the JSON for an already-registered config by ID:

```typescript
const existingId: number = configManager.getDefaultConfigId();
const configJson: string = configManager.createConfigFromId(existingId);
```

---

## 3. Edit with configtool

Import functions from `@senzing/configtool`. Every function accepts a config
JSON string as its first argument and returns a new JSON string with the
change applied. The original string is never mutated.

### Add data sources

```typescript
import {
  addDataSource,
  listDataSources,
  deleteDataSource,
} from "@senzing/configtool";

// Add a data source. The code is automatically uppercased.
let config = addDataSource(configJson, { code: "CUSTOMERS" });
config = addDataSource(config, { code: "WATCHLIST" });

// Optional parameters control retention and reliability.
config = addDataSource(config, {
  code: "ARCHIVE",
  retentionLevel: "Forget", // do not persist candidate keys
  conversational: "No",
  reliability: 10,
});

// List all registered data sources. Returns a JSON array.
const sources = JSON.parse(listDataSources(config));
// sources: [{ id: 1, dataSource: 'SYSTEM' }, { id: 2, dataSource: 'SEARCH' },
//           { id: 3, dataSource: 'CUSTOMERS' }, ...]

// Remove a data source (built-in sources SYSTEM and SEARCH cannot be deleted).
config = deleteDataSource(config, "ARCHIVE");
```

### Add attributes

Attributes map incoming JSON fields to Senzing feature elements. Every
attribute ties a field name to a feature type and element.

```typescript
import {
  addAttribute,
  listAttributes,
  getAttribute,
} from "@senzing/configtool";

config = addAttribute(config, {
  attribute: "PASSPORT_NUMBER",
  feature: "PASSPORT",
  element: "PASSPORT_NUM",
  class: "IDENTIFIER",
});

// Optional fields:
config = addAttribute(config, {
  attribute: "PASSPORT_COUNTRY",
  feature: "PASSPORT",
  element: "PASSPORT_COUNTRY",
  class: "IDENTIFIER",
  required: "Any", // 'Yes', 'No', 'Any', 'Desired'
  internal: "No",
});

const attrs = JSON.parse(listAttributes(config));
// Each entry: { id, attribute, class, feature, element, required, internal }

const attr = JSON.parse(getAttribute(config, "PASSPORT_NUMBER"));
// { ATTR_CODE: 'PASSPORT_NUMBER', ATTR_CLASS: 'IDENTIFIER', ... }
```

### Inspect features, elements, and rules

```typescript
import {
  listFeatures,
  getFeature,
  listElements,
  listRules,
  getRule,
} from "@senzing/configtool";

// Features — high-level entity characteristics (NAME, ADDRESS, DOB, etc.)
const features = JSON.parse(listFeatures(config));

// Individual feature details
const nameFeature = JSON.parse(getFeature(config, "NAME"));

// Elements — the sub-components of a feature
const elements = JSON.parse(listElements(config));

// Resolution rules
const rules = JSON.parse(listRules(config));
const rule = JSON.parse(getRule(config, "1"));
```

### Batch edits with processScript

`processScript` executes a newline-delimited script of commands against the
config JSON and returns the modified config. This is useful when a
configuration change requires many ordered steps.

```typescript
import { processScript } from "@senzing/configtool";

const script = `
addDataSource TRANSACTIONS
addAttribute TRANSACTION_ID TRANSACTION ID IDENTIFIER
addAttribute TRANSACTION_DATE TRANSACTION DATE ATTRIBUTE
`.trim();

config = processScript(config, script);
```

---

## 4. Register the Config

Once you have finished editing, register the config JSON. Registering stores
the document in the Senzing database and returns a numeric config ID.

```typescript
const newConfigId: number = configManager.registerConfig(
  config,
  "Add CUSTOMERS and WATCHLIST data sources",
);
```

The comment is optional but recommended. It appears in the config registry
and makes it easy to identify what changed and when.

---

## 5. Activate the Config

### Safe concurrent activation with replaceDefaultConfigId

In production, multiple processes may be running against the same Senzing
database. Use `replaceDefaultConfigId` to activate a new config ID only if
the current active ID matches what you expect. This prevents accidentally
overwriting a config that another process already updated.

```typescript
// Read the ID that is currently active before your change.
const currentId: number = configManager.getDefaultConfigId();

// Atomically swap it. Throws if currentId no longer matches what is active.
configManager.replaceDefaultConfigId(currentId, newConfigId);
```

If another process changed the default config between your read and your
write, `replaceDefaultConfigId` throws. Handle the conflict by re-reading
the current config and deciding whether to retry or merge.

### One-step register and activate with setDefaultConfig

When you control the deployment (e.g., an initialization script or a test),
you can register and activate in one call:

```typescript
const configId: number = configManager.setDefaultConfig(
  config,
  "Initial configuration with CUSTOMERS and WATCHLIST",
);
```

`setDefaultConfig` registers the config and immediately makes it the active
default, returning the assigned ID. It does not perform optimistic locking,
so use it only when you are sure no other writer is active.

---

## 6. Reinitialize the Engine

After activating a new config, running engine instances are not automatically
updated. Call `reinitialize` so the engine loads the new config from the
database.

```typescript
env.reinitialize(newConfigId);
```

After reinitialize returns, all subsequent engine operations use the new
configuration. You can confirm the active ID:

```typescript
const activeId: number = env.getActiveConfigId();
console.assert(activeId === newConfigId);
```

The `SzEngine` and `SzDiagnostic` handles returned by `getEngine()` and
`getDiagnostic()` remain valid after reinitialize.

---

## 7. Offline Editing

`@senzing/configtool` has no dependency on the Senzing native library. You
can use it in a CI/CD pipeline to prepare config JSON files that are later
loaded into a production environment.

```typescript
import { readFileSync, writeFileSync } from "fs";
import {
  addDataSource,
  addAttribute,
  listDataSources,
  processScript,
} from "@senzing/configtool";

// Read a baseline config JSON saved from a previous export.
let config = readFileSync("baseline-config.json", "utf-8");

// Apply changes.
config = addDataSource(config, { code: "PARTNERS" });
config = addAttribute(config, {
  attribute: "PARTNER_ID",
  feature: "RECORD_TYPE",
  element: "RECORD_TYPE",
  class: "ATTRIBUTE",
});

// Validate the edit.
const sources = JSON.parse(listDataSources(config));
console.log(
  "Data sources:",
  sources.map((s: { dataSource: string }) => s.dataSource),
);

// Write the modified config back to disk.
writeFileSync("updated-config.json", config);
```

Later, in a deployment step that has access to the Senzing runtime:

```typescript
import { SzEnvironment } from "@senzing/sdk";
import { readFileSync } from "fs";

const env = new SzEnvironment("deploy", settings);
const configManager = env.getConfigManager();

const config = readFileSync("updated-config.json", "utf-8");
const newId = configManager.setDefaultConfig(
  config,
  "Deploy partners config v2",
);
env.reinitialize(newId);
```

---

## 8. Config Registry

The config registry stores every version of the configuration that has ever
been registered. Use it to audit history or to roll back to a previous
version.

```typescript
const registryJson: string = configManager.getConfigRegistry();
const registry = JSON.parse(registryJson);

// registry.CONFIGS is an array of registered config entries.
for (const entry of registry.CONFIGS) {
  console.log(`ID: ${entry.CONFIG_ID}  Comment: ${entry.CONFIG_COMMENTS}`);
}
```

To roll back, register the old config JSON (retrieved via
`createConfigFromId`) and activate it:

```typescript
const rollbackId = 42; // ID from the registry
const oldConfig = configManager.createConfigFromId(rollbackId);

const currentId = configManager.getDefaultConfigId();
const restoredId = configManager.registerConfig(
  oldConfig,
  `Rollback to config ${rollbackId}`,
);
configManager.replaceDefaultConfigId(currentId, restoredId);
env.reinitialize(restoredId);
```

---

## Summary

| Goal                               | Method                                                         |
| ---------------------------------- | -------------------------------------------------------------- |
| Get a fresh config template        | `configManager.createConfig()`                                 |
| Get config JSON for an existing ID | `configManager.createConfigFromId(id)`                         |
| Add a data source                  | `addDataSource(config, { code })`                              |
| Add an attribute mapping           | `addAttribute(config, { attribute, feature, element, class })` |
| List data sources / attributes     | `listDataSources(config)` / `listAttributes(config)`           |
| Batch edits                        | `processScript(config, script)`                                |
| Register a config                  | `configManager.registerConfig(json, comment)`                  |
| Activate safely (concurrent)       | `configManager.replaceDefaultConfigId(currentId, newId)`       |
| Register and activate in one step  | `configManager.setDefaultConfig(json, comment)`                |
| Reload a live engine               | `env.reinitialize(configId)`                                   |
| View config history                | `configManager.getConfigRegistry()`                            |
