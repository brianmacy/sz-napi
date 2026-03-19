---
title: Error Handling
group: Guides
category: Reference
---

# Error Handling in sz-napi

sz-napi surfaces two independent error hierarchies: one for the core SDK
(`@senzing/sdk`) and one for the config-manipulation helper (`@senzing/configtool`).

---

## SDK Error Hierarchy

All SDK errors extend the built-in `Error` class through `SzError`.

```
SzError
  +-- SzBadInputError                 (category: 'BadInput',            severity: 'Warning')
  |     +-- SzNotFoundError
  |     +-- SzUnknownDataSourceError
  +-- SzConfigurationError            (category: 'Configuration',        severity: 'Error')
  +-- SzRetryableError                (category: 'Retryable',            severity: 'Warning')
  |     +-- SzDatabaseConnectionLostError
  |     +-- SzDatabaseTransientError
  |     +-- SzRetryTimeoutExceededError
  +-- SzUnrecoverableError            (category: 'Unrecoverable',        severity: 'Critical')
  |     +-- SzDatabaseError
  |     +-- SzLicenseError
  |     +-- SzNotInitializedError
  |     +-- SzUnhandledError
  +-- SzReplaceConflictError          (category: 'ReplaceConflict',      severity: 'Warning')
  +-- SzEnvironmentDestroyedError     (category: 'EnvironmentDestroyed', severity: 'Error')
```

Every `SzError` instance exposes:

| Property    | Type                  | Description                                  |
| ----------- | --------------------- | -------------------------------------------- |
| `message`   | `string`              | Human-readable description (prefix stripped) |
| `code`      | `number \| undefined` | Numeric Senzing error code                   |
| `szCode`    | `string`              | Short symbolic code (e.g. `'SZ_NOT_FOUND'`)  |
| `category`  | `string`              | Broad grouping (see hierarchy above)         |
| `severity`  | `string`              | `'Warning'`, `'Error'`, or `'Critical'`      |
| `component` | `string \| undefined` | Senzing component that raised the error      |

---

## instanceof Patterns

Catch the **most specific** type first, then widen toward `SzError`.

```typescript
import {
  SzError,
  SzBadInputError,
  SzNotFoundError,
  SzUnknownDataSourceError,
  SzRetryableError,
  SzUnrecoverableError,
  SzReplaceConflictError,
} from "@senzing/sdk";

try {
  const result = engine.getRecord("CUSTOMERS", recordId);
  // ...
} catch (err) {
  if (err instanceof SzNotFoundError) {
    // Record or entity does not exist — caller should handle gracefully
    console.warn(`Record not found: ${err.message} (code=${err.code})`);
  } else if (err instanceof SzUnknownDataSourceError) {
    // Data source name is not registered in the active config
    console.error(`Unknown data source: ${err.message}`);
  } else if (err instanceof SzBadInputError) {
    // Any other caller-supplied bad input
    console.error(`Bad input [${err.szCode}]: ${err.message}`);
  } else if (err instanceof SzReplaceConflictError) {
    // Concurrent config update collision — see retry section below
    console.warn("Config conflict, retrying with fresh IDs...");
  } else if (err instanceof SzRetryableError) {
    // Transient failure — safe to retry
    console.warn(`Transient error [${err.szCode}]: ${err.message}`);
  } else if (err instanceof SzUnrecoverableError) {
    // Fatal — log and abort
    console.error(`Unrecoverable [${err.szCode}]: ${err.message}`);
    process.exit(1);
  } else if (err instanceof SzError) {
    // Catch-all for any other Senzing error
    console.error(
      `Senzing error [${err.category}/${err.szCode}]: ${err.message}`,
    );
  } else {
    throw err; // Not a Senzing error — re-raise
  }
}
```

---

## Category Helper Methods

`SzError` provides boolean helpers so application code does not need to
hard-code category strings.

```typescript
import { SzError } from "@senzing/sdk";

function handleSzError(err: SzError): void {
  if (err.isRetryable()) {
    // category === 'Retryable'
    scheduleRetry(err);
  } else if (err.isBadInput()) {
    // category === 'BadInput'
    reportToClient(err);
  } else if (err.isDatabase()) {
    // true for SzDatabaseError, SzDatabaseConnectionLostError,
    // SzDatabaseTransientError
    alertDba(err);
  } else if (err.isUnrecoverable()) {
    // category === 'Unrecoverable'
    fatalShutdown(err);
  } else if (err.isConfiguration()) {
    // category === 'Configuration'
    reloadConfig(err);
  } else if (err.isInitialization()) {
    // true for SzNotInitializedError
    reinitialize(err);
  } else if (err.isLicense()) {
    // true for SzLicenseError
    contactSupport(err);
  }
}
```

Available helpers (all return `boolean`):

| Method               | True when                            |
| -------------------- | ------------------------------------ |
| `isRetryable()`      | `category === 'Retryable'`           |
| `isBadInput()`       | `category === 'BadInput'`            |
| `isUnrecoverable()`  | `category === 'Unrecoverable'`       |
| `isDatabase()`       | Instance of any database error class |
| `isConfiguration()`  | `category === 'Configuration'`       |
| `isInitialization()` | Instance of `SzNotInitializedError`  |
| `isLicense()`        | Instance of `SzLicenseError`         |

---

## Retry Logic for SzRetryableError

When a `SzRetryableError` is thrown the operation is safe to retry after a
short delay. Use exponential backoff with a finite attempt cap.

```typescript
import { SzRetryableError } from "@senzing/sdk";

async function withRetry<T>(
  op: () => T,
  maxAttempts = 5,
  baseDelayMs = 100,
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return op();
    } catch (err) {
      if (err instanceof SzRetryableError && attempt < maxAttempts - 1) {
        const delay = baseDelayMs * 2 ** attempt;
        console.warn(
          `Retryable error [${err.szCode}] on attempt ${attempt + 1}/${maxAttempts}. ` +
            `Retrying in ${delay} ms…`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      } else {
        throw err;
      }
    }
  }
}

// Usage
const result = await withRetry(() => engine.addRecord("CUSTOMERS", id, data));
```

`SzRetryTimeoutExceededError` is itself a `SzRetryableError` — the Senzing
engine's internal retry budget was exhausted. Treat it the same as any other
retryable error but consider a longer initial backoff.

---

## Common Error Codes

### SzUnknownDataSourceError — data source not in config

Thrown when the data source name passed to an engine method (e.g. `addRecord`,
`getRecord`, `deleteRecord`) has not been registered in the active
configuration.

```typescript
import { SzUnknownDataSourceError, SzConfigurationError } from "@senzing/sdk";

try {
  engine.addRecord("UNKNOWN_DS", "42", JSON.stringify({ NAME_FULL: "Alice" }));
} catch (err) {
  if (err instanceof SzUnknownDataSourceError) {
    // The data source 'UNKNOWN_DS' is not present in the loaded config.
    // Add it via configtool / SzConfigManager, then reinitialize.
    console.error(`Data source not registered: ${err.message}`);
  }
}
```

### SzNotFoundError — entity or record does not exist

Thrown by `getRecord`, `getEntityById`, `getEntityByRecord`, and similar
read operations when the requested item is absent from the repository.

```typescript
import { SzNotFoundError } from "@senzing/sdk";

try {
  const raw = engine.getRecord("CUSTOMERS", "9999");
  return JSON.parse(raw);
} catch (err) {
  if (err instanceof SzNotFoundError) {
    return null; // Caller can distinguish "not found" from other errors
  }
  throw err;
}
```

### SzReplaceConflictError — concurrent config update collision

Thrown when two concurrent processes attempt to register a new configuration
using the same base config ID. The correct recovery strategy is to reload the
current config from `SzConfigManager`, apply changes afresh, and re-register
with the new IDs.

```typescript
import { SzReplaceConflictError } from "@senzing/sdk";

async function addDataSourceSafe(
  env: SzEnvironment,
  dataSourceCode: string,
): Promise<void> {
  const configMgr = env.getConfigManager();
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Always load a fresh config on each attempt to avoid stale IDs
      let configJson = configMgr.createConfig();
      configJson = addDataSource(configJson, { code: dataSourceCode });

      const configId = configMgr.registerConfig(
        configJson,
        `Add ${dataSourceCode}`,
      );
      configMgr.setDefaultConfigId(configId);
      env.reinitialize(configId);
      return;
    } catch (err) {
      if (err instanceof SzReplaceConflictError && attempt < maxAttempts - 1) {
        console.warn(`Config conflict on attempt ${attempt + 1}, retrying…`);
        continue;
      }
      throw err;
    }
  }
}
```

---

## ConfigTool Errors (SzConfigError)

The `@senzing/configtool` package uses its own flat error class, `SzConfigError`.
It extends `Error` directly (not `SzError`) and carries a single `errorType`
discriminant instead of a category hierarchy.

```typescript
import { SzConfigError } from "@senzing/configtool";
// or: const { SzConfigError } = require('@senzing/configtool');
```

| Property    | Type              | Description                     |
| ----------- | ----------------- | ------------------------------- |
| `message`   | `string`          | Human-readable description      |
| `errorType` | `ConfigErrorType` | Symbolic type (see table below) |

### ConfigErrorType values

| `errorType`          | When thrown                                                  |
| -------------------- | ------------------------------------------------------------ |
| `'AlreadyExists'`    | Adding a data source / attribute that already exists         |
| `'NotFound'`         | Getting or deleting a data source / attribute that is absent |
| `'InvalidInput'`     | Attempt to delete a system-reserved element (e.g. `SYSTEM`)  |
| `'JsonParse'`        | Config JSON is malformed or empty                            |
| `'MissingSection'`   | Required top-level section absent from config                |
| `'InvalidStructure'` | Config structure does not match the expected schema          |
| `'MissingField'`     | A required field is absent from a config element             |
| `'InvalidConfig'`    | General config validation failure                            |
| `'NotImplemented'`   | Feature not yet supported by configtool                      |
| `'Unknown'`          | Unrecognised native error code                               |

### Handling SzConfigError

```typescript
import { SzConfigError } from "@senzing/configtool";
import * as configtool from "@senzing/configtool";

function ensureDataSource(configJson: string, code: string): string {
  try {
    return configtool.addDataSource(configJson, { code });
  } catch (err) {
    if (err instanceof SzConfigError) {
      switch (err.errorType) {
        case "AlreadyExists":
          // Data source already present — nothing to do
          return configJson;
        case "NotFound":
          console.error(`Data source '${code}' not found: ${err.message}`);
          throw err;
        case "InvalidInput":
          console.error(
            `Cannot modify system data source '${code}': ${err.message}`,
          );
          throw err;
        case "JsonParse":
          console.error(`Config JSON is invalid: ${err.message}`);
          throw err;
        case "MissingSection":
          console.error(`Config is missing required section: ${err.message}`);
          throw err;
        default:
          console.error(`Config error [${err.errorType}]: ${err.message}`);
          throw err;
      }
    }
    throw err;
  }
}
```

---

## Imports Reference

```typescript
// SDK errors
import {
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
} from "@senzing/sdk";

// ConfigTool errors
import { SzConfigError } from "@senzing/configtool";
```
