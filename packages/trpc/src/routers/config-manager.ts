import { t } from '../trpc.js';
import * as s from '../schemas.js';
import { szCall } from '../sz-call.js';

export const configManagerRouter = t.router({
  createConfig: t.procedure
    .query(({ ctx }) => {
      const { configManager } = ctx;
      return szCall(() => JSON.parse(configManager.createConfig()));
    }),

  createConfigFromId: t.procedure
    .input(s.createConfigFromId)
    .query(({ input, ctx }) => {
      const { configManager } = ctx;
      return szCall(() => JSON.parse(configManager.createConfigFromId(input.configId)));
    }),

  createConfigFromDefinition: t.procedure
    .input(s.createConfigFromDefinition)
    .query(({ input, ctx }) => {
      const { configManager } = ctx;
      return szCall(() => JSON.parse(configManager.createConfigFromDefinition(input.configDefinition)));
    }),

  getConfigRegistry: t.procedure
    .query(({ ctx }) => {
      const { configManager } = ctx;
      return szCall(() => JSON.parse(configManager.getConfigRegistry()));
    }),

  getDefaultConfigId: t.procedure
    .query(({ ctx }) => {
      const { configManager } = ctx;
      return szCall(() => configManager.getDefaultConfigId());
    }),

  registerConfig: t.procedure
    .input(s.registerConfig)
    .mutation(({ input, ctx }) => {
      const { configManager } = ctx;
      return szCall(() =>
        configManager.registerConfig(input.configDefinition, input.configComment),
      );
    }),

  replaceDefaultConfigId: t.procedure
    .input(s.replaceDefaultConfigId)
    .mutation(({ input, ctx }) => {
      const { configManager } = ctx;
      szCall(() =>
        configManager.replaceDefaultConfigId(input.currentDefaultConfigId, input.newDefaultConfigId),
      );
    }),

  setDefaultConfig: t.procedure
    .input(s.setDefaultConfig)
    .mutation(({ input, ctx }) => {
      const { configManager } = ctx;
      return szCall(() =>
        configManager.setDefaultConfig(input.configDefinition, input.configComment),
      );
    }),

  setDefaultConfigId: t.procedure
    .input(s.setDefaultConfigId)
    .mutation(({ input, ctx }) => {
      const { configManager } = ctx;
      szCall(() => configManager.setDefaultConfigId(input.configId));
    }),
});
