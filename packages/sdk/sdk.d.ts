export {
  SzConfigManager,
  SzDiagnostic,
  SzEngine,
  SzEnvironment,
  SzProduct,
  FlagEntry,
  RecordKey,
} from './index';

export { bridgeVersion } from './index';

export {
  SzError,
  SzBadInputError,
  SzNotFoundError,
  SzUnknownDataSourceError,
  SzConfigurationError,
  SzRetryableError,
  SzDatabaseConnectionLostError,
  SzDatabaseTransientError,
  SzRetryTimeoutExceededError,
  SzUnrecoverableError,
  SzDatabaseError,
  SzLicenseError,
  SzNotInitializedError,
  SzUnhandledError,
  SzReplaceConflictError,
  SzEnvironmentDestroyedError,
  SzErrorOptions,
  mapToSzError,
} from './js/errors';

export declare const SzFlags: Readonly<Record<string, bigint>>;
