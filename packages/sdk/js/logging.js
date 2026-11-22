'use strict';

// JS-side additions to the native SzLogging binding: argument validation (SzBadInputError naming
// the bad field instead of napi's type-conversion text) and a diagnostic warning for
// registrations that are garbage-collected without `unregister()` / `leak()`. No logging state is
// kept here: every call still goes straight to native.

const { inspect } = require('util');
const { SzBadInputError } = require('./errors');

const MAX_QUEUED_LIMIT = 0xffffffff;

function describe(value) {
  return inspect(value, { depth: 1, breakLength: Infinity });
}

function badInput(message) {
  return new SzBadInputError(message, { szCode: 'SZ_BAD_INPUT' });
}

function checkName(value, field, kind) {
  if (typeof value !== 'string') {
    throw badInput(`${field} must be a log ${kind} name (string), got ${describe(value)}`);
  }
}

function checkOptions(options) {
  if (typeof options === 'string') return;
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw badInput(
      `options must be a log level name or { minLevel, format?, maxQueued? }, got ${describe(options)}`,
    );
  }
  checkName(options.minLevel, 'options.minLevel', 'level');
  if (options.format !== undefined) checkName(options.format, 'options.format', 'format');
  const max = options.maxQueued;
  if (max !== undefined && !(Number.isInteger(max) && max >= 1 && max <= MAX_QUEUED_LIMIT)) {
    throw badInput(
      `options.maxQueued must be an integer from 1 to ${MAX_QUEUED_LIMIT}, got ${describe(max)}`,
    );
  }
}

function checkCallback(callback) {
  if (typeof callback !== 'function') {
    throw badInput(`callback must be a function, got ${describe(callback)}`);
  }
}

function checkOutput(output) {
  if (output === null || typeof output !== 'object' || Array.isArray(output)) {
    throw badInput(`output must be { type, path?, append? }, got ${describe(output)}`);
  }
  if (typeof output.type !== 'string') {
    throw badInput(`output.type must be a string, got ${describe(output.type)}`);
  }
  if (output.path !== undefined && typeof output.path !== 'string') {
    throw badInput(`output.path must be a string, got ${describe(output.path)}`);
  }
  if (output.append !== undefined && typeof output.append !== 'boolean') {
    throw badInput(`output.append must be a boolean, got ${describe(output.append)}`);
  }
}

const checkLevel = (level) => checkName(level, 'level', 'level');
const checkFormat = (format) => checkName(format, 'format', 'format');
const checkOptionsAndCallback = (options, callback) => {
  checkOptions(options);
  checkCallback(callback);
};

// Method -> argument check, run before the native call.
const LOGGING_CHECKS = {
  registerCallback: checkOptionsAndCallback,
  registerThreadLocalCallback: checkOptionsAndCallback,
  setDefaultCallback: checkOptionsAndCallback,
  captureThreadLogs: checkOptions,
  setDefaultOutput: checkOutput,
  setDefaultFormat: checkFormat,
  setDefaultLogLevel: checkLevel,
};
const REGISTRATION_CHECKS = { setLevel: checkLevel };

function addChecks(NativeClass, checks) {
  for (const [name, check] of Object.entries(checks)) {
    const original = NativeClass.prototype[name];
    NativeClass.prototype[name] = function checked(...args) {
      check(...args);
      return original.apply(this, args);
    };
  }
}

// A registration collected without unregister() / leak() stays registered natively (GC never
// unregisters: it can run while engine threads log, which is unsafe on Senzing 4.5.0). Warn, so
// the silent leak is visible. Diagnostic only: it does not change what stays registered.
const collected = new FinalizationRegistry((minLevel) => {
  process.emitWarning(
    `An SzLogRegistration (minLevel ${minLevel}) was garbage-collected without unregister() or ` +
      'leak(). Its callback stays registered and keeps the effective log level at or below ' +
      'that level for the rest of the process. Call unregister() when done, or leak() to keep ' +
      'it on purpose.',
    { code: 'SZ_LOG_REGISTRATION_COLLECTED' },
  );
});

function minLevelOf(options) {
  return typeof options === 'string' ? options : options.minLevel;
}

function watchRegistrations(NativeLogging, NativeRegistration) {
  for (const name of ['registerCallback', 'registerThreadLocalCallback']) {
    const original = NativeLogging.prototype[name];
    NativeLogging.prototype[name] = function watched(options, callback) {
      const registration = original.call(this, options, callback);
      collected.register(registration, String(minLevelOf(options)).trim().toUpperCase(), registration);
      return registration;
    };
  }
  for (const name of ['unregister', 'leak']) {
    const original = NativeRegistration.prototype[name];
    NativeRegistration.prototype[name] = function released() {
      collected.unregister(this);
      return original.call(this);
    };
  }
  // `using registration = logging.registerCallback(...)` unregisters at scope exit.
  if (typeof Symbol.dispose === 'symbol') {
    NativeRegistration.prototype[Symbol.dispose] = function dispose() {
      this.unregister();
    };
  }
}

/** Installs validation and the collection warning on the (already error-wrapped) classes. */
function installLogging(native) {
  addChecks(native.SzLogging, LOGGING_CHECKS);
  addChecks(native.SzLogRegistration, REGISTRATION_CHECKS);
  watchRegistrations(native.SzLogging, native.SzLogRegistration);
}

module.exports = { installLogging };
