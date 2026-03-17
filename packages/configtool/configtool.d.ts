// Re-export all auto-generated types from the native module
export * from './index';

// Re-export the bridge version
export { bridgeVersion } from './index';

/** Error type for config tool operations. */
export declare class SzConfigError extends Error {
  name: 'SzConfigError';
  /** The category of configuration error (e.g., 'NotFound', 'AlreadyExists', 'InvalidInput'). */
  errorType: string;
  constructor(errorType: string, message: string);
}
