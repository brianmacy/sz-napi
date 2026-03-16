# Deployment Guide

Production deployment guide for `@senzing/sdk` (sz-napi).

---

## 1. Docker

### Base image

The `@senzing/sdk` package contains only the NAPI bridge binary (a few MB). The Senzing runtime libraries and support data must be present in the container. Use an Ubuntu or Debian base image and install `senzingsdk-runtime` via `apt`.

```dockerfile
FROM ubuntu:24.04

# Install Senzing runtime
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://senzing-production-apt.s3.amazonaws.com/senzingstaging.conf \
      | tee /etc/apt/sources.list.d/senzing.list && \
    apt-get update && apt-get install -y senzingsdk-runtime && \
    rm -rf /var/lib/apt/lists/*

# Make Senzing libraries visible to the dynamic linker
ENV LD_LIBRARY_PATH=/opt/senzing/er/lib

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

CMD ["node", "dist/server.js"]
```

### Volume mounts

Senzing support data (the `SUPPORTPATH`) can be large. Mount it from the host or a dedicated data volume rather than baking it into the image:

```yaml
# docker-compose.yml excerpt
services:
  app:
    image: my-senzing-app
    environment:
      - LD_LIBRARY_PATH=/opt/senzing/er/lib
    volumes:
      - senzing-data:/opt/senzing/data:ro

volumes:
  senzing-data:
    external: true
```

---

## 2. PostgreSQL

SQLite is convenient for development but not suitable for production. Use PostgreSQL for concurrent access, durability, and scale.

### Settings JSON

Pass this as the `settings` argument to `SzEnvironment`:

```json
{
  "PIPELINE": {
    "CONFIGPATH": "/opt/senzing/er/resources/templates",
    "RESOURCEPATH": "/opt/senzing/er/resources",
    "SUPPORTPATH": "/opt/senzing/data"
  },
  "SQL": {
    "CONNECTION": "postgresql://user:password@host:5432/senzing"
  }
}
```

### TypeScript example

```typescript
import { SzEnvironment } from "@senzing/sdk";

const settings = JSON.stringify({
  PIPELINE: {
    CONFIGPATH: "/opt/senzing/er/resources/templates",
    RESOURCEPATH: "/opt/senzing/er/resources",
    SUPPORTPATH: "/opt/senzing/data",
  },
  SQL: {
    CONNECTION: process.env.SENZING_DB_URL,
  },
});

const env = new SzEnvironment("my-service", settings);
```

Keep credentials out of source code. Read `SENZING_DB_URL` (or equivalent) from an environment variable, a secrets manager, or a mounted secret file at startup.

---

## 3. Environment Variables

### Library path

The Senzing shared libraries must be on the dynamic linker search path before Node.js starts.

| Platform | Variable            | Typical value                              |
| -------- | ------------------- | ------------------------------------------ |
| Linux    | `LD_LIBRARY_PATH`   | `/opt/senzing/er/lib`                      |
| macOS    | `DYLD_LIBRARY_PATH` | `/opt/homebrew/opt/senzing/runtime/er/lib` |

Set these in your shell profile, systemd unit file, Docker `ENV` directive, or Kubernetes `env` block — not inside your Node.js process, because the dynamic linker reads them before the process starts.

```bash
# systemd unit excerpt
[Service]
Environment=LD_LIBRARY_PATH=/opt/senzing/er/lib
Environment=SENZING_DB_URL=postgresql://user:password@db:5432/senzing
ExecStart=/usr/bin/node /app/dist/server.js
```

### Passing settings at startup

Construct the settings object at process startup from environment variables so no credentials are hardcoded:

```typescript
function buildSettings(): string {
  return JSON.stringify({
    PIPELINE: {
      CONFIGPATH:
        process.env.SENZING_CONFIGPATH ?? "/opt/senzing/er/resources/templates",
      RESOURCEPATH:
        process.env.SENZING_RESOURCEPATH ?? "/opt/senzing/er/resources",
      SUPPORTPATH: process.env.SENZING_SUPPORTPATH ?? "/opt/senzing/data",
    },
    SQL: {
      CONNECTION: process.env.SENZING_DB_URL,
    },
  });
}

const env = new SzEnvironment("my-service", buildSettings());
```

---

## 4. Thread Safety and Performance

NAPI-RS schedules each synchronous Rust function on the libuv thread pool, so engine calls never block the Node.js event loop. Multiple calls can be in-flight simultaneously; the Senzing engine handles internal locking.

### Increasing the thread pool

By default libuv uses 4 worker threads. For heavy ingestion workloads, increase this before the process starts:

```bash
UV_THREADPOOL_SIZE=16 node dist/server.js
```

Set `UV_THREADPOOL_SIZE` to match the expected concurrency of simultaneous engine calls. Values larger than the number of CPU cores rarely help and can increase contention.

### Worker threads for isolation

For Electron apps or services where you want hard isolation between workloads, use `worker_threads`. Each worker creates its own `SzEnvironment`:

```typescript
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";

const settings = buildSettings();

// Spawn a worker that owns its own SzEnvironment
const worker = new Worker(
  fileURLToPath(new URL("./worker.js", import.meta.url)),
  { workerData: { settings } },
);

worker.on("message", (result) => {
  console.log("Worker result:", result);
});

worker.postMessage({
  type: "add-record",
  dataSourceCode: "DS",
  recordId: "1",
  recordDefinition: "{}",
});
```

The worker file initializes its own environment and processes messages:

```typescript
// worker.ts
import { isMainThread, parentPort, workerData } from "node:worker_threads";
import { SzEnvironment, SzFlags } from "@senzing/sdk";

if (!isMainThread && parentPort) {
  const env = new SzEnvironment("worker", workerData.settings);
  const engine = env.getEngine();

  parentPort.postMessage({ type: "ready" });

  parentPort.on("message", (msg) => {
    if (msg.type === "shutdown") {
      env.destroy();
      process.exit(0);
    }
    // handle other message types ...
  });
}
```

See `examples/electron-worker.ts` for the complete bidirectional pattern.

---

## 5. Monitoring

`engine.getStats()` returns a JSON string with internal performance counters: throughput rates, cache hit ratios, thread workload distribution, and timing histograms. Log these periodically or expose them via a health endpoint.

```typescript
import { SzEnvironment } from "@senzing/sdk";

function logStats(env: SzEnvironment): void {
  const raw = env.getEngine().getStats();
  const stats = JSON.parse(raw) as Record<string, unknown>;

  // Log the full stats object at debug level
  console.debug("senzing_stats", JSON.stringify(stats));

  // Extract key counters for a metrics system
  const workload = stats["workload"] as Record<string, number> | undefined;
  if (workload) {
    console.info("senzing_workload", {
      addRecordCount: workload["addedRecords"] ?? 0,
      reresolutionCount: workload["reresolutionTriggered"] ?? 0,
      reresolutionTime: workload["reresolutionTime"] ?? 0,
    });
  }
}

// Emit stats every 60 seconds
setInterval(() => logStats(env), 60_000);
```

For production, emit these counters to your observability platform (Datadog, Prometheus, CloudWatch, etc.) rather than stdout.

---

## 6. Prebuilt Binaries

npm installs the prebuilt `.node` binary for your platform automatically via optional dependencies. No Rust toolchain or build step is needed in production.

The prebuilt artifacts are published as platform-specific packages:

| Package                        | Platform    |
| ------------------------------ | ----------- |
| `@senzing/sdk-darwin-arm64`    | macOS arm64 |
| `@senzing/sdk-linux-x64-gnu`   | Linux x64   |
| `@senzing/sdk-linux-arm64-gnu` | Linux arm64 |
| `@senzing/sdk-win32-x64-msvc`  | Windows x64 |

When npm runs `npm install @senzing/sdk`, it resolves and downloads only the binary matching the current platform.

### Offline or air-gapped environments

If the target host cannot reach the npm registry, download the `.node` artifact directly from the GitHub Releases page for the `sz-napi` repository. Place the file alongside `sdk.js` in the `@senzing/sdk` package directory. The JS entry point loads the `.node` file by platform name — no other configuration is required.

```bash
# Example: manually place the Linux x64 binary
cp senzing-sdk.linux-x64-gnu.node node_modules/@senzing/sdk/
```
