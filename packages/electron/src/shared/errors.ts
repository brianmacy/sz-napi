import {
  SzError, SzBadInputError, SzNotFoundError, SzUnknownDataSourceError,
  SzConfigurationError, SzRetryableError, SzDatabaseConnectionLostError,
  SzDatabaseTransientError, SzRetryTimeoutExceededError, SzUnrecoverableError,
  SzDatabaseError, SzLicenseError, SzNotInitializedError, SzUnhandledError,
  SzReplaceConflictError, SzEnvironmentDestroyedError,
} from "@senzing/sdk";

export interface SerializedSzError {
  className: string;
  message: string;
  szCode: string;
  code?: number;
  component?: string;
  category: string;
  severity: string;
  stack?: string;
}

const CLASS_MAP: Record<string, typeof SzError> = {
  SzBadInputError, SzNotFoundError, SzUnknownDataSourceError,
  SzConfigurationError, SzRetryableError, SzDatabaseConnectionLostError,
  SzDatabaseTransientError, SzRetryTimeoutExceededError, SzUnrecoverableError,
  SzDatabaseError, SzLicenseError, SzNotInitializedError, SzUnhandledError,
  SzReplaceConflictError, SzEnvironmentDestroyedError,
};

export function serializeSzError(err: SzError): SerializedSzError {
  return {
    className: err.constructor.name,
    message: err.message,
    szCode: err.szCode ?? "",
    code: err.code,
    component: err.component,
    category: err.category ?? "",
    severity: err.severity ?? "",
    stack: err.stack,
  };
}

export function deserializeSzError(data: SerializedSzError): SzError {
  const Ctor = CLASS_MAP[data.className] || SzError;
  const err = new Ctor(data.message, {
    szCode: data.szCode,
    code: data.code,
    component: data.component,
    category: data.category,
    severity: data.severity,
  });
  if (data.stack) err.stack = data.stack;
  return err;
}
