/**
 * SzTrpcEnvironment — tRPC context wrapper around SzEnvironment.
 *
 * Mirrors the SzGrpcEnvironment naming convention used in other
 * Senzing SDK bindings (sz-sdk-java-grpc, sz-sdk-typescript-grpc).
 *
 * Resolves sub-interfaces once at construction and exposes itself
 * as the tRPC context for all routers.
 */
import type {
  SzEnvironment,
  SzEngine,
  SzConfigManager,
  SzDiagnostic,
  SzProduct,
} from '@senzing/sdk';

export interface SzContext {
  env: SzEnvironment;
  engine: SzEngine;
  configManager: SzConfigManager;
  diagnostic: SzDiagnostic;
  product: SzProduct;
}

export interface SzTrpcEnvironmentOptions {
  /** A pre-initialized SzEnvironment instance. */
  environment: SzEnvironment;
}

/**
 * Wraps an SzEnvironment for use as a tRPC context.
 *
 * @example
 * ```ts
 * const env = new SzEnvironment('my-app', settings);
 * const szTrpc = new SzTrpcEnvironment({ environment: env });
 *
 * app.use('/trpc', createExpressMiddleware({
 *   router: szRouter,
 *   createContext: () => szTrpc.context,
 * }));
 * ```
 */
export class SzTrpcEnvironment {
  readonly context: SzContext;

  constructor(opts: SzTrpcEnvironmentOptions) {
    const env = opts.environment;
    this.context = {
      env,
      engine: env.getEngine(),
      configManager: env.getConfigManager(),
      diagnostic: env.getDiagnostic(),
      product: env.getProduct(),
    };
  }

  get env() { return this.context.env; }
  get engine() { return this.context.engine; }
  get configManager() { return this.context.configManager; }
  get diagnostic() { return this.context.diagnostic; }
  get product() { return this.context.product; }
}
