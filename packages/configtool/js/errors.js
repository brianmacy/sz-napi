'use strict';

const CODE_PATTERN = /^\[([A-Za-z]+)\]\s*/;

const VALID_TYPES = new Set([
  'JsonParse',
  'NotFound',
  'AlreadyExists',
  'InvalidInput',
  'MissingSection',
  'InvalidStructure',
  'MissingField',
  'InvalidConfig',
  'NotImplemented',
]);

class SzConfigError extends Error {
  constructor(errorType, message) {
    super(message);
    this.name = 'SzConfigError';
    this.errorType = errorType;
  }
}

function mapToConfigError(nativeError) {
  const message = nativeError.message || String(nativeError);
  const match = message.match(CODE_PATTERN);

  let errorType = 'Unknown';
  let cleanMessage = message;

  if (match) {
    const parsed = match[1];
    errorType = VALID_TYPES.has(parsed) ? parsed : 'Unknown';
    cleanMessage = message.slice(match[0].length);
  }

  const error = new SzConfigError(errorType, cleanMessage);
  if (nativeError.stack) {
    error.stack = nativeError.stack;
  }
  return error;
}

module.exports = { SzConfigError, mapToConfigError };
