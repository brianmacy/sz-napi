export interface SzErrorOptions {
  szCode?: string;
  code?: number;
  component?: string;
  category?: string;
  severity?: string;
}

/**
 * Base class for all Senzing errors. Every error thrown by the SDK is an
 * instance of `SzError` (or one of its subclasses), so a single `catch`
 * block can handle the entire hierarchy.
 *
 * @example
 * ```typescript
 * try {
 *   engine.getRecord("CUSTOMERS", "9999");
 * } catch (e) {
 *   if (e instanceof SzError) {
 *     console.log(`[${e.category}/${e.severity}] ${e.message}`);
 *     console.log(`Retryable: ${e.isRetryable()}, BadInput: ${e.isBadInput()}`);
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/error-handling/error-inspection | error-inspection snippet}
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/docs/guides/error-handling.md | Error Handling Guide}
 */
export class SzError extends Error {
  readonly szCode: string;
  readonly code?: number;
  readonly component?: string;
  readonly category: string;
  readonly severity: string;

  constructor(message: string, options?: SzErrorOptions);

  /** Returns `true` when the operation can safely be retried after a short delay. */
  isRetryable(): boolean;
  /** Returns `true` when the error is unrecoverable and the process should be restarted. */
  isUnrecoverable(): boolean;
  /** Returns `true` when the caller supplied invalid input (bad record, unknown key, etc.). */
  isBadInput(): boolean;
  /** Returns `true` when the error originated from the database layer. */
  isDatabase(): boolean;
  /** Returns `true` when the error is related to Senzing licensing. */
  isLicense(): boolean;
  /** Returns `true` when the error is related to Senzing configuration. */
  isConfiguration(): boolean;
  /** Returns `true` when the error indicates the engine has not been initialized. */
  isInitialization(): boolean;
}

/**
 * The caller supplied invalid input. Parent of {@link SzNotFoundError} and
 * {@link SzUnknownDataSourceError}.
 */
export class SzBadInputError extends SzError {}

/**
 * The requested record or entity was not found.
 *
 * @example
 * ```typescript
 * try {
 *   engine.getRecord("CUSTOMERS", "9999");
 * } catch (e) {
 *   if (e instanceof SzNotFoundError) {
 *     return null; // Not found is expected
 *   }
 *   throw e; // Re-throw unexpected errors
 * }
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/error-handling/error-inspection | error-inspection snippet}
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/docs/guides/error-handling.md | Error Handling Guide}
 */
export class SzNotFoundError extends SzBadInputError {}

/**
 * A data source referenced in the request is not registered in the current
 * Senzing configuration.
 *
 * @example
 * ```typescript
 * try {
 *   engine.addRecord("UNKNOWN_DS", "1", record);
 * } catch (e) {
 *   if (e instanceof SzUnknownDataSourceError) {
 *     console.error(`Register data source first: ${e.message}`);
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/error-handling/error-inspection | error-inspection snippet}
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/docs/guides/error-handling.md | Error Handling Guide}
 */
export class SzUnknownDataSourceError extends SzBadInputError {}

/** A Senzing configuration error. */
export class SzConfigurationError extends SzError {}

/**
 * The operation failed due to a transient condition and can be retried.
 *
 * @example
 * ```typescript
 * try {
 *   engine.addRecord("CUSTOMERS", "1001", record);
 * } catch (e) {
 *   if (e instanceof SzRetryableError) {
 *     // Safe to retry after a delay
 *     await new Promise(r => setTimeout(r, 1000));
 *     engine.addRecord("CUSTOMERS", "1001", record);
 *   } else {
 *     throw e;
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/error-handling/error-inspection | error-inspection snippet}
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/docs/guides/error-handling.md | Error Handling Guide}
 */
export class SzRetryableError extends SzError {}

/** The database connection was lost. Retrying may re-establish it. */
export class SzDatabaseConnectionLostError extends SzRetryableError {}

/** A transient database error occurred. */
export class SzDatabaseTransientError extends SzRetryableError {}

/** The retry timeout was exceeded before the operation could complete. */
export class SzRetryTimeoutExceededError extends SzRetryableError {}

/** An unrecoverable error; the process should typically be restarted. */
export class SzUnrecoverableError extends SzError {}

/** An unrecoverable database error. */
export class SzDatabaseError extends SzUnrecoverableError {}

/** A Senzing license error (expired, exceeded, etc.). */
export class SzLicenseError extends SzUnrecoverableError {}

/** The Senzing engine has not been initialized. */
export class SzNotInitializedError extends SzUnrecoverableError {}

/** An error that does not map to any known Senzing error category. */
export class SzUnhandledError extends SzUnrecoverableError {}

/**
 * A concurrent configuration replacement conflict. Another process updated
 * the default configuration between read and replace; reload and retry.
 *
 * @example
 * ```typescript
 * try {
 *   configManager.replaceDefaultConfigId(currentId, newId);
 * } catch (e) {
 *   if (e instanceof SzReplaceConflictError) {
 *     // Another process updated the config; reload and retry
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/error-handling/error-inspection | error-inspection snippet}
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/docs/guides/error-handling.md | Error Handling Guide}
 */
export class SzReplaceConflictError extends SzError {}

/**
 * The {@link SzEnvironment} has already been destroyed. Create a new
 * environment to continue using the SDK.
 *
 * @example
 * ```typescript
 * env.destroy();
 * try {
 *   env.getEngine(); // Throws!
 * } catch (e) {
 *   if (e instanceof SzEnvironmentDestroyedError) {
 *     console.log("Environment already destroyed");
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/error-handling/error-inspection | error-inspection snippet}
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/docs/guides/error-handling.md | Error Handling Guide}
 */
export class SzEnvironmentDestroyedError extends SzError {}

export function mapToSzError(nativeError: Error): SzError;
