---
title: Logging
group: Guides
category: Reference
---

# Logging

`@senzing/sdk` exposes Senzing's native logging library (libSzLogging, first shipped in Senzing
4.5.0, the minimum version this SDK supports) through `env.getLogging()`. You can receive log
records in JavaScript, route the default output to stderr, stdout, a file or nowhere, choose the
message format, and change the level at runtime.

All logging state lives in native libSzLogging. The SDK keeps no registry, dispatcher, cache or
formatter of its own: every call is one native call, and every registration is its own native
registration. The API mirrors the Rust SDK (`sz-rust-sdk` 4.5.0) in camelCase.

## Quick start

```typescript
import { SzEnvironment, SzLogLevel } from "@senzing/sdk";

const env = new SzEnvironment("my-app", settings);
const logging = env.getLogging();          // no native initialization happens here

logging.setDefaultOutput({ type: "NULL" }); // the callback is the only sink
const registration = logging.registerCallback(SzLogLevel.Info, (record) => {
  console.log(`[${record.level}] ${record.module}: ${record.message}`);
});

const engine = env.getEngine();            // initialization messages reach the callback
// ... use the engine ...
env.destroy();
registration.unregister();                 // after destroy: nothing else is logging
```

## The Senzing 4.5.0 usage rule

**Change registrations, the default callback, the default output or the default format only while
no engine threads are running: before the first engine initialization or after `destroy()`.**
`setDefaultLogLevel` and `getEffectiveLogLevel` are safe at any time.

- "Before the first engine initialization" means before the first `getEngine()`,
  `getDiagnostic()` or `reinitialize()`.
- Senzing starts its own threads at engine initialization that log until `destroy()`, so finishing
  your own work is not enough.
- The SDK does not enforce the rule. Senzing 4.5.0 rebuilds its sink list for these calls without
  synchronizing with threads that are logging; the full concurrency guarantees need a newer
  Senzing (GDEV-4960).

`getLogging()` works before the engine is initialized and also after `destroy()`, which is when
the rule allows these changes.

## Delivery: asynchronous, non-blocking

Native calls a callback on the thread that logs, often an engine thread. The SDK copies the record
and queues it for the JavaScript thread that registered the callback with a non-blocking napi
thread-safe function, so a logging thread never waits for the event loop:

- The JavaScript callback runs **later**, on the registering thread's event loop. A record logged
  during a synchronous engine call (for example `engine.addRecord(...)`) arrives after that call
  returns.
- The queue is unbounded: records are not dropped while the process runs, but a JavaScript thread
  that stays busy for a long time while Senzing logs at `TRACE` accumulates them in memory.
- A record is a plain object:

  | Field         | Type                  | Notes                                                                              |
  | ------------- | --------------------- | ---------------------------------------------------------------------------------- |
  | `level`       | `SzLogLevel`          | Never `'OFF'`                                                                       |
  | `module`      | `string`              | Native's module up to its last `:` (`szstatic`)                                     |
  | `threadHash`  | `string \| undefined` | After the last `:` (`82eb15f5faba9bab`); the per-thread handle on Senzing 4.5.0      |
  | `message`     | `string`              | As native formatted it for this registration                                        |
  | `timestampNs` | `bigint \| undefined` | UTC nanoseconds since the epoch; `undefined` until Senzing 4.5.1 / 4.6.0             |
  | `threadId`    | `bigint \| undefined` | OS thread id; `undefined` until Senzing 4.5.1 / 4.6.0                               |

- An exception thrown by a callback is reported as an uncaught exception, as for any event
  callback. Catch inside the callback if that is not what you want.
- In a worker thread, a registration delivers to that worker. When the worker exits, its pending
  records are discarded and later records are ignored.

## Process lifetime

Registrations and default callbacks never keep the Node.js process alive (their thread-safe
functions are unref'd). Records still queued when the process exits are discarded, so drain the
queue (for example `await new Promise((r) => setTimeout(r, 100))`) after `destroy()` if you need
every record.

## Registrations

`registerCallback(options, callback)` takes a level (`"INFO"`) or `{ minLevel, format? }`. The
format defaults to `'BARE'`: the record already carries level and module, and `'LEGACY'` would
stamp them a second time. While a registration lives, native lowers the effective level to its
`minLevel` if needed.

Remove a registration with `unregister()` (idempotent) or by disposal:

```typescript
{
  using registration = logging.registerCallback("DEBUG", onRecord);
  // ...
} // unregistered here
```

Records already queued when you unregister are still delivered.

**Garbage collection never unregisters.** It runs at arbitrary times, possibly while engine threads
log, which the 4.5.0 usage rule forbids. A registration that becomes unreachable without
`unregister()` stays registered for the rest of the process, like `leak()`.

## Default output

| Call                                                | Effect                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| `setDefaultOutput({ type: "STDERR" })`              | The native default                                                         |
| `setDefaultOutput({ type: "STDOUT" })`              | Standard output                                                            |
| `setDefaultOutput({ type: "FILE", path })`          | Truncates and writes `path`; missing parent directories are created        |
| `setDefaultOutput({ type: "NULL" })`                | Discard; only registered callbacks receive messages                        |
| `setDefaultCallback(options, callback)`             | The default output is a callback, at `minLevel`, in `format` (default BARE) |
| `setDefaultFormat(format)`                          | The default output's format                                                |
| `setDefaultLogLevel(level)`                         | The default output's level; safe at any time                               |
| `getEffectiveLogLevel()`                            | The minimum over the default output and every registration                 |

- On Senzing 4.5.0 `setDefaultOutput` resets the format to `'LEGACY'`, so call `setDefaultFormat`
  **after** it.
- A `'FILE'` output is opened for append first and throws `SzBadInputError` naming the path if it
  cannot be opened (Senzing 4.5.0 reports no status); the previous output is kept.
- **Flushing:** a file output is flushed when the output is replaced or at process exit. On
  Senzing 4.5.0 `destroy()` does not flush it, so call `setDefaultOutput(...)` after `destroy()`
  before reading the file.
- A default callback has no handle. It stays until `setDefaultOutput` or another
  `setDefaultCallback` replaces it; on Senzing 4.5.0 a replaced callback is leaked, so set it once.
- `setDefaultLogLevel`, `setDefaultFormat` and `setDefaultCallback` mark logging as configured by
  the application: from then on the environment's `verboseLogging` no longer changes the default
  level or format at engine initialization.

## Levels and formats

`SzLogLevel` and `SzLogFormat` are both string types and frozen constant objects built from the
native binding (`SzLogLevel.Warn === "WARN"`, `SzLogLevel.ALL` most verbose first). Arguments are
case-insensitive; `"warning"` and `"json"` are accepted. An unknown name throws `SzBadInputError`.

| Format    | Message                                                                              |
| --------- | ------------------------------------------------------------------------------------ |
| `LEGACY`  | `YYYY-MM-DD HH:MM:SS.mmm [module:hash] SEV: msg` (local time)                         |
| `JSONL`   | `{"timestamp": ..., "module": ..., "severity": ..., "message": ...}`                  |
| `BARE`    | The message text only                                                                |
| `DEFAULT` | spdlog's default pattern for the default output; the message only for a callback     |

Native writes its own level spellings in formatted messages: JSONL `severity` is lower case with
`warning`; LEGACY tags are `TRCE`, `DBUG`, `INFO`, `WARN`, `ERR`, `CRIT`.

## Needs Senzing 4.5.1 / 4.6.0

These are part of the final API but throw `SzConfigurationError` (naming the native function and
"requires Senzing >= 4.5.1/4.6.0") on Senzing 4.5.0. There is no runtime version detection.

| API                                                        | Native feature                                       |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| `registration.setLevel(level)`, `registration.level()`     | Per-callback levels                                  |
| `getDefaultOutput()`, `getDefaultFormat()`, `getDefaultLogLevel()` | Default-state getters                        |
| `setDefaultOutput({ type: "FILE", path, append: true })`   | Append mode                                          |
| `registerThreadLocalCallback(...)`, `captureThreadLogs(...)` | Thread-local delivery (4.5.0 never delivers, GDEV-4960) |
| `record.timestampNs`, `record.threadId`                    | `undefined` until then                               |

Until then, use `setDefaultLogLevel` to change verbosity at runtime and group records by
`threadHash` instead of registering per thread.

## See also

- [log-callback snippet](https://github.com/brianmacy/sz-napi/tree/main/code-snippets/logging/log-callback/)
- [logging example](https://github.com/brianmacy/sz-napi/tree/main/examples/logging/) (module
  statistics, runtime verbosity toggle)
