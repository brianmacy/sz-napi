export type ConfigErrorType =
  | 'JsonParse'
  | 'NotFound'
  /** A call-element delete found the element is not on an existing call (benign; was `NotFound` before 0.10). */
  | 'NotOnCall'
  /** A call-element delete named an element that is not a member of the given feature. */
  | 'NotInFeature'
  | 'AlreadyExists'
  /** A call / call-element add was a no-op because it is already present (benign; was `AlreadyExists` before 0.10). */
  | 'AlreadyPresent'
  | 'InvalidInput'
  | 'MissingSection'
  | 'InvalidStructure'
  | 'MissingField'
  | 'InvalidConfig'
  | 'NotImplemented'
  /** Aggregated field validation failures; see `SzConfigError.failures`. */
  | 'ValidationErrors'
  | 'Unknown';

/** One field-level validation failure (only present on `ValidationErrors`). */
export interface ConfigValidationFailure {
  /** camelCase field tag, e.g. `behavior`, `sendToRedo`, `candidates`, `overrides` */
  field: string;
  /** `MISSING` | `WRONG_TYPE` | `OUT_OF_DOMAIN` | `UNKNOWN_REFERENCE_CODE` | `NOT_FOUND` | `DUPLICATE` */
  reasonCode: string;
  offendingValue: string | null;
}

export class SzConfigError extends Error {
  readonly errorType: ConfigErrorType;
  /** Set only when `errorType === 'ValidationErrors'`. */
  readonly failures?: ConfigValidationFailure[];
  constructor(errorType: ConfigErrorType, message: string, failures?: ConfigValidationFailure[]);
}

export function mapToConfigError(nativeError: Error): SzConfigError;
