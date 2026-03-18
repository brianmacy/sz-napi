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

export const productRouter = t.router({
  getVersion: t.procedure
    .query(({ ctx }) => {
      const { product } = ctx as SzContext;
      return szCall(() => JSON.parse(product.getVersion()));
    }),

  getLicense: t.procedure
    .query(({ ctx }) => {
      const { product } = ctx as SzContext;
      return szCall(() => JSON.parse(product.getLicense()));
    }),
});
