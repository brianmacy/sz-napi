// Re-export all auto-generated types from the native module
export * from './index';

// Re-export the bridge version
export { bridgeVersion } from './index';

/** Error type for config tool operations. */
export declare class SzConfigError extends Error {
  name: 'SzConfigError';
  /** The category of configuration error (e.g., 'NotFound', 'NotOnCall', 'AlreadyExists', 'AlreadyPresent', 'ValidationErrors'). */
  errorType: string;
  /** Structured field failures; present only when `errorType === 'ValidationErrors'`. */
  failures?: Array<{ field: string; reasonCode: string; offendingValue: string | null }>;
  constructor(errorType: string, message: string, failures?: Array<{ field: string; reasonCode: string; offendingValue: string | null }>);
}
