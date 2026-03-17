# Electron App Example

A minimal Electron application demonstrating NAPI-RS + worker threads for
Senzing entity resolution. The main process bootstraps a SQLite database,
spawns a worker thread that owns the `SzEnvironment`, and relays IPC calls
from the renderer through a secure preload bridge.

## Architecture

```
Renderer (index.html + renderer.ts)
    |  window.senzing.*
    v
Preload (preload.ts) — contextBridge + ipcRenderer
    |  ipcMain.handle
    v
Main Process (main.ts) — BrowserWindow, IPC handlers
    |  worker.postMessage / worker.on("message")
    v
Worker Thread (worker.ts) — SzEnvironment, SzEngine, SzProduct
```

## Prerequisites

- **Senzing runtime** installed:
  - macOS: `brew install senzingsdk-runtime-unofficial`
  - Linux: Install from Senzing packages
- **Node.js** 18+
- **sqlite3** CLI (for database initialization)

## Setup

```bash
# From the repo root, build the SDK first
npm install
npm run build

# Then set up this example
cd examples/electron-app
npm install
```

## Running

```bash
npm start
```

This compiles TypeScript and launches Electron. The app window shows:

- Senzing version info at the top
- A form to add records (data source, record ID, name, DOB, address)
- A search box to find entities by name

## Key Design Decisions

1. **Worker thread owns SzEnvironment**: The Senzing engine is thread-safe
   and the worker keeps the main thread responsive. All SDK calls happen
   in the worker.

2. **Secure IPC**: The renderer has no access to Node.js APIs.
   `contextBridge.exposeInMainWorld` exposes only the three Senzing
   methods (getVersion, addRecord, searchByAttributes).

3. **NAPI-RS ABI stability**: The `.node` binary uses N-API (ABI-stable),
   so it works with Electron without rebuilding. If you encounter issues,
   run `npm run rebuild`.

4. **Self-contained setup**: The main process creates a fresh SQLite
   database at `/tmp/senzing-electron-example.db` and bootstraps data
   sources on every startup.
