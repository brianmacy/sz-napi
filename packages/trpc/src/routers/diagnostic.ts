import { t } from '../trpc.js';
import * as s from '../schemas.js';
import { szCall } from '../sz-call.js';

export const diagnosticRouter = t.router({
  checkRepositoryPerformance: t.procedure
    .input(s.checkRepositoryPerformance)
    .query(({ input, ctx }) => {
      const { diagnostic } = ctx;
      return szCall(() => JSON.parse(diagnostic.checkRepositoryPerformance(input.secondsToRun)));
    }),

  getFeature: t.procedure
    .input(s.getFeature)
    .query(({ input, ctx }) => {
      const { diagnostic } = ctx;
      return szCall(() => JSON.parse(diagnostic.getFeature(input.featureId)));
    }),

  getRepositoryInfo: t.procedure
    .query(({ ctx }) => {
      const { diagnostic } = ctx;
      return szCall(() => JSON.parse(diagnostic.getRepositoryInfo()));
    }),

  purgeRepository: t.procedure
    .mutation(({ ctx }) => {
      const { diagnostic } = ctx;
      szCall(() => diagnostic.purgeRepository());
    }),
});
