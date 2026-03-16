export type ConfigErrorType =
  | 'JsonParse'
  | 'NotFound'
  | 'AlreadyExists'
  | 'InvalidInput'
  | 'MissingSection'
  | 'InvalidStructure'
  | 'MissingField'
  | 'InvalidConfig'
  | 'NotImplemented'
  | 'Unknown';

export class SzConfigError extends Error {
  readonly errorType: ConfigErrorType;
  constructor(errorType: ConfigErrorType, message: string);
}

export function mapToConfigError(nativeError: Error): SzConfigError;
