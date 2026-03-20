# @senzing/types

Shared TypeScript interfaces for Senzing SDK transports.

## Overview

This package defines the canonical Senzing API contract as TypeScript interfaces. All transport implementations satisfy these interfaces:

| Transport | Implementation Classes | Package |
|-----------|----------------------|---------|
| Native (NAPI) | `SzEngineNative`, `SzConfigManagerNative`, etc. | `@senzing/sdk` |
| tRPC (HTTP) | `SzTrpcClient` (via `createSzClient`) | `@senzing/trpc` |
| Electron (IPC) | `window.senzing` (via preload) | `@senzing/electron` |

## Installation

```bash
npm install @senzing/types
```

## Usage

Write transport-agnostic code that works with any Senzing client:

```typescript
import type { SzEngine, SzProduct } from '@senzing/types';

async function investigate(engine: SzEngine) {
  const entity = await engine.getEntityById(123);
  const path = await engine.findPath(1, 2, 5);
  return { entity, path };
}

// Works with native adapter
import { SzEnvironment, SzEngineNative } from '@senzing/sdk';
const env = new SzEnvironment('myApp', settings);
const engine = new SzEngineNative(env.getEngine());
await investigate(engine);

// Works with tRPC client
import { createSzClient } from '@senzing/trpc/client';
const sz = createSzClient({ url: 'http://localhost:3000/trpc' });
await investigate(sz.engine);

// Works with Electron renderer
await investigate(window.senzing.engine);
```

## Interfaces

| Interface | Methods | Description |
|-----------|---------|-------------|
| `SzEngine` | 26 | Entity resolution: records, search, analysis, export |
| `SzConfigManager` | 9 | Configuration lifecycle: create, register, activate |
| `SzDiagnostic` | 4 | Repository monitoring and maintenance |
| `SzProduct` | 2 | Version and license information |
| `SzEnvironment` | 4 | Lifecycle: destroy, reinitialize, status |
| `RecordKey` | — | Type for `{ dataSourceCode, recordId }` pairs |

## Design Principles

- **Async throughout** — all methods return `Promise`. Native adapters wrap sync calls.
- **Parsed returns** — methods return parsed objects (`Promise<any>`), not raw JSON strings.
- **Collected exports** — export methods return complete results, not streaming iterators.
- **Standardized nullability** — `flags?: bigint`, `searchProfile?: string | null`.

## License

[Apache-2.0](../../LICENSE)
