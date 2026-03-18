import { z } from 'zod';
import { t } from '../trpc.js';
import { toTRPCError } from '../errors.js';
import type { SzContext } from '../context.js';

function szCall<T>(fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    throw toTRPCError(err);
  }
}

export const environmentRouter = t.router({
  getActiveConfigId: t.procedure
    .query(({ ctx }) => {
      const { env } = ctx as SzContext;
      return szCall(() => env.getActiveConfigId());
    }),

  reinitialize: t.procedure
    .input(z.object({ configId: z.number() }))
    .mutation(({ input, ctx }) => {
      const { env } = ctx as SzContext;
      szCall(() => env.reinitialize(input.configId));
    }),

  isDestroyed: t.procedure
    .query(({ ctx }) => {
      const { env } = ctx as SzContext;
      return env.isDestroyed();
    }),
});
