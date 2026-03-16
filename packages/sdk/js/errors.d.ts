export interface SzErrorOptions {
  szCode?: string;
  code?: number;
  component?: string;
  category?: string;
  severity?: string;
}

export class SzError extends Error {
  readonly szCode: string;
  readonly code?: number;
  readonly component?: string;
  readonly category: string;
  readonly severity: string;

  constructor(message: string, options?: SzErrorOptions);

  isRetryable(): boolean;
  isUnrecoverable(): boolean;
  isBadInput(): boolean;
  isDatabase(): boolean;
  isLicense(): boolean;
  isConfiguration(): boolean;
  isInitialization(): boolean;
}

export class SzBadInputError extends SzError {}
export class SzNotFoundError extends SzBadInputError {}
export class SzUnknownDataSourceError extends SzBadInputError {}

export class SzConfigurationError extends SzError {}

export class SzRetryableError extends SzError {}
export class SzDatabaseConnectionLostError extends SzRetryableError {}
export class SzDatabaseTransientError extends SzRetryableError {}
export class SzRetryTimeoutExceededError extends SzRetryableError {}

export class SzUnrecoverableError extends SzError {}
export class SzDatabaseError extends SzUnrecoverableError {}
export class SzLicenseError extends SzUnrecoverableError {}
export class SzNotInitializedError extends SzUnrecoverableError {}
export class SzUnhandledError extends SzUnrecoverableError {}

export class SzReplaceConflictError extends SzError {}
export class SzEnvironmentDestroyedError extends SzError {}

export function mapToSzError(nativeError: Error): SzError;
