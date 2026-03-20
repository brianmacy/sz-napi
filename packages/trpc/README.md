# @senzing/trpc

tRPC routers that expose the Senzing SDK as typed remote procedures over HTTP.

## Installation

```bash
npm install @senzing/trpc @senzing/sdk
```

The server-side package requires `@senzing/sdk` (with the Senzing runtime) as a peer dependency. Clients only need `@senzing/trpc/client` — no native libraries required.

## Quick Start

### Server (Express)

```typescript
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { SzEnvironment } from '@senzing/sdk';
import { szRouter, SzTrpcEnvironment } from '@senzing/trpc';

const env = new SzEnvironment('my-app', settings);
const szTrpc = new SzTrpcEnvironment({ environment: env });

const app = express();
app.use('/trpc', createExpressMiddleware({
  router: szRouter,
  createContext: () => szTrpc.context,
}));
app.listen(3000);
```

### Client (Browser or Node.js)

```typescript
import { createSzClient } from '@senzing/trpc/client';

const sz = createSzClient({ url: 'http://localhost:3000/trpc' });

const version = await sz.product.getVersion();
await sz.engine.addRecord('CUSTOMERS', '1001', '{"NAME_FULL":"Bob Smith"}');
const entity = await sz.engine.getEntityByRecord('CUSTOMERS', '1001');
```

The wrapped client uses **positional args** matching the native `@senzing/sdk` signatures — no `.query()` / `.mutate()` wrappers needed.

## API Reference

### Server Exports (`@senzing/trpc`)

| Export | Description |
|--------|-------------|
| `szRouter` | Combined tRPC router with all Senzing sub-routers |
| `SzTrpcEnvironment` | Lifecycle wrapper — takes an `SzEnvironment`, provides tRPC context |
| `t` | tRPC instance for extending the router |
| `schemas` | Zod input schemas for all procedures |
| `toTRPCError` | Maps `SzError` to typed `TRPCError` |
| `szCall` | Error-wrapping utility for procedure handlers |
| `METHOD_REGISTRY` | Method definitions for building custom wrappers |
| `createAuthMiddleware` | Optional auth middleware hook |

### Client Exports (`@senzing/trpc/client`)

| Export | Description |
|--------|-------------|
| `createSzClient` | Creates a wrapped client with positional arg signatures |
| `createSzRawClient` | Creates a standard tRPC client with object-style API |

### Sub-Routers

Cherry-pick individual routers if you don't need the full surface area:

```typescript
import { t, engineRouter, productRouter } from '@senzing/trpc';

const minimalRouter = t.router({
  engine: engineRouter,
  product: productRouter,
});
```

## Security

- **Authentication**: Use `createAuthMiddleware()` to protect procedures:
  ```typescript
  import { createAuthMiddleware, t } from '@senzing/trpc';
  const requireAuth = createAuthMiddleware(async (token) => {
    return await verifyJwt(token);
  });
  ```
- **CORS**: Always restrict `Access-Control-Allow-Origin` to your frontend domain in production.
- **Destructive operations**: Guard `purgeRepository` and `destroy` with authentication or disable them entirely.

## Architecture

```
Browser / Remote Node.js
  │
  │  HTTP + superjson (handles bigint flags)
  ▼
┌─────────────────────┐
│  Express + tRPC     │
│  szRouter           │
│  ├── engine         │
│  ├── configManager  │
│  ├── diagnostic     │
│  ├── product        │
│  └── environment    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  SzTrpcEnvironment  │
│  (SzContext)        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  @senzing/sdk       │
│  (NAPI-RS bindings) │
└─────────────────────┘
```

## License

[Apache-2.0](../../LICENSE)
