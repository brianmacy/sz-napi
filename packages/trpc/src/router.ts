/**
 * Combined Senzing tRPC router.
 *
 * Namespaces each Senzing interface under its own sub-router:
 *   sz.engine.getEntityById(...)
 *   sz.configManager.createConfig()
 *   sz.diagnostic.getRepositoryInfo()
 *   sz.product.getVersion()
 *   sz.environment.getActiveConfigId()
 */
import { t } from './trpc.js';
import { engineRouter } from './routers/engine.js';
import { configManagerRouter } from './routers/config-manager.js';
import { diagnosticRouter } from './routers/diagnostic.js';
import { productRouter } from './routers/product.js';
import { environmentRouter } from './routers/environment.js';

export const szRouter = t.router({
  engine: engineRouter,
  configManager: configManagerRouter,
  diagnostic: diagnosticRouter,
  product: productRouter,
  environment: environmentRouter,
});

export type SzRouter = typeof szRouter;
