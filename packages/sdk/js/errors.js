'use strict';

const CODE_PATTERN = /^\[([A-Z_]+)\]\s*/;

class SzError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.szCode = options.szCode || '';
    this.code = options.code;
    this.component = options.component;
    this.category = options.category || 'Unknown';
    this.severity = options.severity || 'Error';
  }

  isRetryable() {
    return this.category === 'Retryable';
  }

  isUnrecoverable() {
    return this.category === 'Unrecoverable';
  }

  isBadInput() {
    return this.category === 'BadInput';
  }

  isDatabase() {
    return this instanceof SzDatabaseError ||
           this instanceof SzDatabaseConnectionLostError ||
           this instanceof SzDatabaseTransientError;
  }

  isLicense() {
    return this instanceof SzLicenseError;
  }

  isConfiguration() {
    return this.category === 'Configuration';
  }

  isInitialization() {
    return this instanceof SzNotInitializedError;
  }
}

class SzBadInputError extends SzError {
  constructor(message, options = {}) {
    super(message, { ...options, category: 'BadInput', severity: 'Warning' });
  }
}

class SzNotFoundError extends SzBadInputError {
  constructor(message, options = {}) {
    super(message, options);
  }
}

class SzUnknownDataSourceError extends SzBadInputError {
  constructor(message, options = {}) {
    super(message, options);
  }
}

class SzConfigurationError extends SzError {
  constructor(message, options = {}) {
    super(message, { ...options, category: 'Configuration', severity: 'Error' });
  }
}

class SzRetryableError extends SzError {
  constructor(message, options = {}) {
    super(message, { ...options, category: 'Retryable', severity: 'Warning' });
  }
}

class SzDatabaseConnectionLostError extends SzRetryableError {
  constructor(message, options = {}) {
    super(message, options);
  }
}

class SzDatabaseTransientError extends SzRetryableError {
  constructor(message, options = {}) {
    super(message, options);
  }
}

class SzRetryTimeoutExceededError extends SzRetryableError {
  constructor(message, options = {}) {
    super(message, options);
  }
}

class SzUnrecoverableError extends SzError {
  constructor(message, options = {}) {
    super(message, { ...options, category: 'Unrecoverable', severity: 'Critical' });
  }
}

class SzDatabaseError extends SzUnrecoverableError {
  constructor(message, options = {}) {
    super(message, options);
  }
}

class SzLicenseError extends SzUnrecoverableError {
  constructor(message, options = {}) {
    super(message, options);
  }
}

class SzNotInitializedError extends SzUnrecoverableError {
  constructor(message, options = {}) {
    super(message, options);
  }
}

class SzUnhandledError extends SzUnrecoverableError {
  constructor(message, options = {}) {
    super(message, options);
  }
}

class SzReplaceConflictError extends SzError {
  constructor(message, options = {}) {
    super(message, { ...options, category: 'ReplaceConflict', severity: 'Warning' });
  }
}

class SzEnvironmentDestroyedError extends SzError {
  constructor(message, options = {}) {
    super(message, { ...options, category: 'EnvironmentDestroyed', severity: 'Error' });
  }
}

const CODE_TO_CLASS = {
  SZ_BAD_INPUT: SzBadInputError,
  SZ_NOT_FOUND: SzNotFoundError,
  SZ_UNKNOWN_DATA_SOURCE: SzUnknownDataSourceError,
  SZ_CONFIGURATION: SzConfigurationError,
  SZ_RETRYABLE: SzRetryableError,
  SZ_DB_CONNECTION_LOST: SzDatabaseConnectionLostError,
  SZ_DB_TRANSIENT: SzDatabaseTransientError,
  SZ_RETRY_TIMEOUT: SzRetryTimeoutExceededError,
  SZ_DATABASE: SzDatabaseError,
  SZ_LICENSE: SzLicenseError,
  SZ_NOT_INITIALIZED: SzNotInitializedError,
  SZ_UNHANDLED: SzUnhandledError,
  SZ_UNRECOVERABLE: SzUnrecoverableError,
  SZ_REPLACE_CONFLICT: SzReplaceConflictError,
  SZ_ENVIRONMENT_DESTROYED: SzEnvironmentDestroyedError,
};

function mapToSzError(nativeError) {
  const message = nativeError.message || String(nativeError);
  const match = message.match(CODE_PATTERN);

  let szCode = '';
  let cleanMessage = message;
  let ErrorClass = SzUnhandledError;

  if (match) {
    szCode = match[1];
    cleanMessage = message.slice(match[0].length);
    ErrorClass = CODE_TO_CLASS[szCode] || SzUnhandledError;
  }

  const error = new ErrorClass(cleanMessage, { szCode });
  if (nativeError.stack) {
    error.stack = nativeError.stack;
  }
  return error;
}

module.exports = {
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
};
