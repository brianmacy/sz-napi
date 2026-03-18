/**
 * @senzing/trpc/client — Client-side entry point.
 *
 * This module exports only types and a thin helper for creating a
 * typed tRPC client. It does NOT import @senzing/sdk at runtime,
 * so it's safe to use in browsers and environments without native
 * Senzing libraries.
 *
 * @example Browser client
 * ```ts
 * import { createSzClient } from '@senzing/trpc/client';
 *
 * const sz = createSzClient({ url: 'http://localhost:3000/trpc' });
 *
 * const entity = await sz.engine.getEntityById.query({ entityId: 1 });
 * const version = await sz.product.getVersion.query();
 * ```
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { SzRouter } from './router.js';

export type { SzRouter } from './router.js';

export interface CreateSzClientOptions {
  /** Full URL to the tRPC endpoint, e.g. "http://localhost:3000/trpc" */
  url: string;
  /** Additional HTTP headers to send with every request. */
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
}

/**
 * Creates a typed tRPC client wired to a Senzing tRPC server.
 *
 * Uses superjson transformer to match the server, ensuring bigint
 * flags and other non-JSON-native types survive the round trip.
 */
export function createSzClient(opts: CreateSzClientOptions) {
  return createTRPCClient<SzRouter>({
    links: [
      httpBatchLink({
        url: opts.url,
        headers: opts.headers,
        transformer: superjson,
      }),
    ],
  });
}
