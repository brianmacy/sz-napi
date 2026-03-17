// ESM wrapper for @senzing/sdk — re-exports all named exports from the CJS entry point.
import sdk from './sdk.js';

export const {
  SzEnvironment,
  SzEngine,
  SzConfigManager,
  SzDiagnostic,
  SzProduct,
  SzExportIterator,
  SzFlags,
  bridgeVersion,
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
  mapToSzError,
} = sdk;

export default sdk;
