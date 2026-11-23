## SzLogging in the Node.js SDK (Senzing 4.5.0+)

### Design

All logging state lives in native libSzLogging, exactly as in `sz-rust-sdk` (the reference design; C#, Java and Python follow it). `packages/sdk/src/logging.rs` keeps no registry, dispatcher or formatter: each JS registration is one native registration whose closure forwards records to JS through a napi `ThreadsafeFunction`.

- **Non-blocking:** the closure runs on whatever thread logs (often an engine thread) and queues with `ThreadsafeFunctionCallMode::NonBlocking`, so a logging thread never waits on the event loop.
- **Bounded queue (opt-in):** `{ minLevel, format?, maxQueued? }`. With `maxQueued`, records over the cap are dropped and counted; read the count with `SzLogRegistration.getDropped()`. Without it the queue is unbounded.
- **Weak:** the function is unref'd, so a registration never keeps the process alive. Records still queued at exit are discarded.
- **Worker teardown:** once the registering JS environment is gone, the closure returns before copying the record. The native registration stays registered, because removing it from an environment-teardown hook could race engine threads (unsafe on 4.5.0).
- **Forgotten registrations:** `packages/sdk/js/logging.js` uses a `FinalizationRegistry` to emit a `SZ_LOG_REGISTRATION_COLLECTED` warning when an `SzLogRegistration` is garbage-collected without `unregister()` or `leak()`. Its callback stays registered and keeps the effective log level low.

### Versioning

Requiring SzLogging raised the minimum Senzing to 4.5.0, so the package version is `4.5.0-N`: the SDK version is the minimum Senzing version. Internal `@senzing/*` ranges must be `>=4.5.0-0`, because npm semver treats `-N` as a prerelease.
