'use strict';

const native = require('./index.js');
const { wrapClass, wrapFunction } = require('./js/wrapper');
const errors = require('./js/errors');
const adapters = require('./js/adapter');
const { installLogging } = require('./js/logging');

// Wrap all class methods with error mapping

wrapClass(native.SzEnvironment, [
  'destroy',
  'reinitialize',
  'getActiveConfigId',
  'getEngine',
  'getConfigManager',
  'getDiagnostic',
  'getProduct',
  'getLogging',
]);

wrapClass(native.SzEngine, [
  'primeEngine',
  'getStats',
  'addRecord',
  'deleteRecord',
  'reevaluateRecord',
  'reevaluateEntity',
  'getRecord',
  'getRecordPreview',
  'getEntityById',
  'getEntityByRecord',
  'searchByAttributes',
  'whySearch',
  'whyEntities',
  'whyRecords',
  'whyRecordInEntity',
  'howEntity',
  'getVirtualEntity',
  'findInterestingEntitiesById',
  'findInterestingEntitiesByRecord',
  'findPath',
  'findNetwork',
  'getRedoRecord',
  'countRedoRecords',
  'processRedoRecord',
  'exportJsonEntityReportHandle',
  'exportCsvEntityReportHandle',
  'fetchNext',
  'closeExportReport',
]);

wrapClass(native.SzConfigManager, [
  'createConfig',
  'createConfigFromId',
  'createConfigFromDefinition',
  'getConfigRegistry',
  'getDefaultConfigId',
  'registerConfig',
  'replaceDefaultConfigId',
  'setDefaultConfig',
  'setDefaultConfigId',
]);

wrapClass(native.SzDiagnostic, [
  'checkRepositoryPerformance',
  'getFeature',
  'getRepositoryInfo',
  'purgeRepository',
]);

wrapClass(native.SzProduct, [
  'getLicense',
  'getVersion',
]);

wrapClass(native.SzLogging, [
  'registerCallback',
  'registerThreadLocalCallback',
  'captureThreadLogs',
  'setDefaultCallback',
  'setDefaultOutput',
  'getDefaultOutput',
  'setDefaultFormat',
  'getDefaultFormat',
  'setDefaultLogLevel',
  'getDefaultLogLevel',
  'getEffectiveLogLevel',
]);

wrapClass(native.SzLogRegistration, [
  'unregister',
  'leak',
  'setLevel',
  'getLevel',
  'getDropped',
]);

wrapClass(native.SzLogCapture, ['finish']);

// Argument validation, the collected-registration warning and `Symbol.dispose`.
installLogging(native);

// Frozen log constants built from the native lists (sz-rust-sdk is the single source):
// `SzLogLevel.Warn === 'WARN'`, `SzLogLevel.ALL` most verbose first.
function logConstants(entries) {
  const constants = Object.fromEntries(entries.map(e => [e.name, e.value]));
  constants.ALL = Object.freeze(entries.map(e => e.value));
  return Object.freeze(constants);
}
const SzLogLevel = logConstants(native.getLogLevels());
const SzLogFormat = logConstants(native.getLogFormats());

// SzExportIterator — wraps export handle with iterator protocol
class SzExportIterator {
  constructor(engine, handle) {
    this._engine = engine;
    this._handle = handle;
    this._closed = false;
  }

  next() {
    if (this._closed) return '';
    const chunk = this._engine.fetchNext(this._handle);
    if (chunk === '') {
      this.close();
    }
    return chunk;
  }

  close() {
    if (!this._closed) {
      this._closed = true;
      this._engine.closeExportReport(this._handle);
    }
  }

  [Symbol.iterator]() {
    return {
      next: () => {
        const value = this.next();
        return value === ''
          ? { done: true, value: undefined }
          : { done: false, value };
      },
      return: () => {
        this.close();
        return { done: true, value: undefined };
      },
    };
  }
}

// Define the public export methods on top of the native handle methods.
// The native binding exposes `export{Json,Csv}EntityReportHandle` (returning a
// numeric handle); the public `export{Json,Csv}EntityReport` wraps that handle
// in an SzExportIterator. Keeping the names distinct avoids a return-type
// collision (number vs SzExportIterator) in the generated types.
const _origExportJson = native.SzEngine.prototype.exportJsonEntityReportHandle;
native.SzEngine.prototype.exportJsonEntityReport = function (...args) {
  const handle = _origExportJson.apply(this, args);
  return new SzExportIterator(this, handle);
};

const _origExportCsv = native.SzEngine.prototype.exportCsvEntityReportHandle;
native.SzEngine.prototype.exportCsvEntityReport = function (...args) {
  const handle = _origExportCsv.apply(this, args);
  return new SzExportIterator(this, handle);
};

// Build frozen SzFlags object from native flag entries
const flagEntries = native.getAllFlags();
const SzFlags = Object.freeze(
  Object.fromEntries(flagEntries.map(e => [e.name, e.value]))
);

module.exports = {
  // Classes
  SzEnvironment: native.SzEnvironment,
  SzEngine: native.SzEngine,
  SzConfigManager: native.SzConfigManager,
  SzDiagnostic: native.SzDiagnostic,
  SzProduct: native.SzProduct,
  SzLogging: native.SzLogging,
  SzLogRegistration: native.SzLogRegistration,
  SzLogCapture: native.SzLogCapture,

  // Logging: the interface without an environment, and the constants
  getLogging: wrapFunction(native.getLogging),
  SzLogLevel,
  SzLogFormat,

  // Iterator
  SzExportIterator,

  // Flags
  SzFlags,

  // Bridge version
  bridgeVersion: native.bridgeVersion,

  // Error classes
  SzError: errors.SzError,
  SzBadInputError: errors.SzBadInputError,
  SzNotFoundError: errors.SzNotFoundError,
  SzUnknownDataSourceError: errors.SzUnknownDataSourceError,
  SzConfigurationError: errors.SzConfigurationError,
  SzRetryableError: errors.SzRetryableError,
  SzDatabaseConnectionLostError: errors.SzDatabaseConnectionLostError,
  SzDatabaseTransientError: errors.SzDatabaseTransientError,
  SzRetryTimeoutExceededError: errors.SzRetryTimeoutExceededError,
  SzUnrecoverableError: errors.SzUnrecoverableError,
  SzDatabaseError: errors.SzDatabaseError,
  SzLicenseError: errors.SzLicenseError,
  SzNotInitializedError: errors.SzNotInitializedError,
  SzUnhandledError: errors.SzUnhandledError,
  SzReplaceConflictError: errors.SzReplaceConflictError,
  SzEnvironmentDestroyedError: errors.SzEnvironmentDestroyedError,
  mapToSzError: errors.mapToSzError,

  // Adapter classes (async parsed-JSON wrappers)
  SzEngineNative: adapters.SzEngineNative,
  SzConfigManagerNative: adapters.SzConfigManagerNative,
  SzDiagnosticNative: adapters.SzDiagnosticNative,
  SzProductNative: adapters.SzProductNative,
  SzEnvironmentNative: adapters.SzEnvironmentNative,
};
