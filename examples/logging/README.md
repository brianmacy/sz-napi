# Logging

Demonstrates Senzing native logging (`SzLogging`, Senzing 4.5.0+) from Node.js:

- **Module statistics:** a registered callback counts records per module and level.
- **Verbosity toggle:** the default output is a callback (`setDefaultCallback`) whose level is
  raised and lowered with `setDefaultLogLevel` while the engine runs (safe at any time).
- **The Senzing 4.5.0 usage rule:** callbacks and the default output are set up before the engine
  is initialized and removed after `destroy()`.
- **Asynchronous delivery:** native calls the callbacks on the thread that logs; the SDK queues the
  records without blocking it, and they reach JavaScript on the next turns of the event loop.

## Prerequisites

- Senzing runtime 4.5.0 or later installed
- `DYLD_LIBRARY_PATH` (macOS) or `LD_LIBRARY_PATH` (Linux) set to the Senzing lib directory

## Run

```bash
npm install
npm start
```
