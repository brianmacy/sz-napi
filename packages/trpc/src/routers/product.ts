import { t } from '../trpc.js';
import { szCall } from '../sz-call.js';

export const productRouter = t.router({
  getVersion: t.procedure
    .query(({ ctx }) => {
      const { product } = ctx;
      return szCall(() => product.getVersion());
    }),

  getLicense: t.procedure
    .query(({ ctx }) => {
      const { product } = ctx;
      return szCall(() => product.getLicense());
    }),
});
