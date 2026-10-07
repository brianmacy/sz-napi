'use strict';

const CODE_PATTERN = /^\[([A-Za-z]+)\]\s*/;

// Must match FAILURES_MARKER in src/error.rs.
const FAILURES_MARKER = '\n@failures:';

const VALID_TYPES = new Set([
  'JsonParse',
  'NotFound',
  'NotOnCall',
  'NotInFeature',
  'AlreadyExists',
  'AlreadyPresent',
  'InvalidInput',
  'MissingSection',
  'InvalidStructure',
  'MissingField',
  'InvalidConfig',
  'NotImplemented',
  'ValidationErrors',
]);

class SzConfigError extends Error {
  constructor(errorType, message, failures) {
    super(message);
    this.name = 'SzConfigError';
    this.errorType = errorType;
    if (failures !== undefined) {
      this.failures = failures;
    }
  }
}

function mapToConfigError(nativeError) {
  let message = nativeError.message || String(nativeError);
  let failures;

  const markerAt = message.indexOf(FAILURES_MARKER);
  if (markerAt >= 0) {
    // The native side wrote this JSON itself; a parse failure is a bug and must surface.
    failures = JSON.parse(message.slice(markerAt + FAILURES_MARKER.length));
    message = message.slice(0, markerAt);
  }

  const match = message.match(CODE_PATTERN);

  let errorType = 'Unknown';
  let cleanMessage = message;

  if (match) {
    const parsed = match[1];
    errorType = VALID_TYPES.has(parsed) ? parsed : 'Unknown';
    cleanMessage = message.slice(match[0].length);
  }

  const error = new SzConfigError(errorType, cleanMessage, failures);
  if (nativeError.stack) {
    error.stack = nativeError.stack;
  }
  return error;
}

module.exports = { SzConfigError, mapToConfigError };
