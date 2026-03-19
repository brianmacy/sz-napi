/**
 * @senzing/trpc — Server-side entry point.
 *
 * Provides pre-built tRPC routers wrapping @senzing/sdk, SzTrpcEnvironment
 * for lifecycle management, Zod schemas for all procedure inputs, and the
 * combined SzRouter type that clients import for end-to-end type safety.
 *
 * @example Server setup (Express)
 * ```ts
 * import express from 'express';
 * import { createExpressMiddleware } from '@trpc/server/adapters/express';
 * import { SzEnvironment } from '@senzing/sdk';
 * import { szRouter, SzTrpcEnvironment } from '@senzing/trpc';
 *
 * const env = new SzEnvironment('my-app', settings);
 * const szTrpc = new SzTrpcEnvironment({ environment: env });
 *
 * const app = express();
 * app.use('/trpc', createExpressMiddleware({
 *   router: szRouter,
 *   createContext: () => szTrpc.context,
 * }));
 * app.listen(3000);
 * ```
 */

// Router & type
export { szRouter, type SzRouter } from './router.js';

// Context
export { SzTrpcEnvironment, type SzContext, type SzTrpcEnvironmentOptions } from './context.js';

// tRPC instance (for consumers who want to extend the router)
export { t } from './trpc.js';

// Sub-routers (for consumers who want to cherry-pick)
export { engineRouter } from './routers/engine.js';
export { configManagerRouter } from './routers/config-manager.js';
export { diagnosticRouter } from './routers/diagnostic.js';
export { productRouter } from './routers/product.js';
export { environmentRouter } from './routers/environment.js';

// Schemas (for consumers who want to reuse validation)
export * as schemas from './schemas.js';

// Error mapping
export { toTRPCError } from './errors.js';

// Authentication middleware
export { createAuthMiddleware } from './middleware.js';

// Shared error-wrapping utility
export { szCall } from './sz-call.js';

// Method registry (for consumers who want to build custom wrappers)
export { METHOD_REGISTRY, METHOD_MAP, type MethodDef } from './methods.js';

// Client wrapper
export { wrapClient } from './wrapper.js';
export type { SzTrpcClient } from './wrapper-types.js';
