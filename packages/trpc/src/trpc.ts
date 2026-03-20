/**
 * Shared tRPC instance used by all routers.
 *
 * superjson is configured as the transformer so that bigint flags,
 * Dates, Maps, etc. survive JSON serialization over the wire.
 */
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { SzContext } from './context.js';

export const t = initTRPC.context<SzContext>().create({
  transformer: superjson,
});
