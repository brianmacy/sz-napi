# @senzing/electron

Electron IPC bridge for the Senzing SDK. Runs the SDK in a worker thread and exposes it to the renderer via `contextBridge`.

## Installation

```bash
npm install @senzing/electron @senzing/sdk
```

## Setup

### Main Process

```typescript
import { app } from 'electron';
import { SzElectronEnvironment } from '@senzing/electron';

const sz = new SzElectronEnvironment();

app.whenReady().then(async () => {
  sz.setup();
  await sz.initialize(settings);

  // Use SDK-style positional args
  const version = await sz.product.getVersion();
  await sz.engine.addRecord('CUSTOMERS', '1001', '{"NAME_FULL":"Bob"}');
});

app.on('before-quit', () => sz.teardown());
```

### Preload Script

```typescript
// In your BrowserWindow webPreferences:
{
  preload: require.resolve('@senzing/electron/preload'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: false,
}
```

### Renderer

```typescript
// window.senzing is available via contextBridge
const version = await window.senzing.product.getVersion();
await window.senzing.engine.addRecord('CUSTOMERS', '1001', record);

// Flags are available as bigint constants
const flags = window.senzing.flags;
const entity = await window.senzing.engine.getEntityById(1, flags.ENTITY_DEFAULT_FLAGS);
```

Add type declarations to your renderer's tsconfig:

```typescript
import '@senzing/electron/renderer'; // Adds window.senzing types
```

## Architecture

```
┌─────────────────────────────────┐
│  Renderer Process               │
│  window.senzing.engine.*(...)   │
│  (contextBridge API)            │
└─────────────┬───────────────────┘
              │ IPC (sz:call)
              ▼
┌─────────────────────────────────┐
│  Main Process                   │
│  SzElectronEnvironment          │
│  ├── setup()  — IPC handlers    │
│  ├── initialize() — start SDK   │
│  └── teardown() — cleanup       │
└─────────────┬───────────────────┘
              │ worker_threads
              ▼
┌─────────────────────────────────┐
│  Worker Thread                  │
│  SzEnvironment + SDK services   │
│  (owns all native resources)    │
└─────────────────────────────────┘
```

## Security Model

- **Context isolation**: Enabled by default. The renderer cannot access Node.js APIs directly.
- **No `nodeIntegration`**: The preload uses `contextBridge` to expose a controlled API surface.
- **`sandbox: false`**: Required for the preload script to use Node.js APIs (`contextBridge`, `ipcRenderer`). Context isolation still protects the renderer's JavaScript environment.
- **Worker thread isolation**: The SDK runs in a separate thread, preventing blocking the main process.

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `workerPath` | `./worker.js` (relative to package) | Path to the worker script |
| `timeoutMs` | `60000` | Timeout for worker calls in milliseconds |

## Limitations

- Export methods (`exportJsonEntityReport`, `exportCsvEntityReport`) collect all results in memory before returning. For very large exports, consider using the tRPC server with streaming instead.
- `SzFlags` are loaded synchronously from the main process during preload initialization. If the main process handler isn't ready yet, flags will be empty.

## License

[Apache-2.0](../../LICENSE)
