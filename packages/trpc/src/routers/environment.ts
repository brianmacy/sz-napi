import { z } from 'zod';
import { t } from '../trpc.js';
import { szCall } from '../sz-call.js';

export const environmentRouter = t.router({
  getActiveConfigId: t.procedure
    .query(({ ctx }) => {
      const { env } = ctx;
      return szCall(() => env.getActiveConfigId());
    }),

  reinitialize: t.procedure
    .input(z.object({ configId: z.number() }))
    .mutation(({ input, ctx }) => {
      const { env } = ctx;
      szCall(() => env.reinitialize(input.configId));
    }),

  isDestroyed: t.procedure
    .query(({ ctx }) => {
      const { env } = ctx;
      return env.isDestroyed();
    }),

  destroy: t.procedure
    .mutation(({ ctx }) => {
      const { env } = ctx;
      szCall(() => env.destroy());
    }),
});
