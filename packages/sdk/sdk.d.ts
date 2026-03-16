export {
  SzConfigManager,
  SzDiagnostic,
  SzEnvironment,
  SzProduct,
  FlagEntry,
  RecordKey,
} from './index';

export { SzEngine } from './index';

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

/** Iterator for streaming entity export results. */
export declare class SzExportIterator {
  /** Fetches the next chunk of export data. Returns empty string when complete. */
  next(): string;
  /** Closes the export and releases resources. Safe to call multiple times. */
  close(): void;
  [Symbol.iterator](): Iterator<string>;
}

declare module './index' {
  interface SzEngine {
    /** Starts a JSON entity export. Returns an SzExportIterator. */
    exportJsonEntityReport(flags?: bigint | undefined | null): SzExportIterator;
    /** Starts a CSV entity export. Returns an SzExportIterator. */
    exportCsvEntityReport(csvColumnList: string, flags?: bigint | undefined | null): SzExportIterator;
  }
}
