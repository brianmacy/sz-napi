/**
 * Maps Senzing error classes to tRPC error codes so clients get
 * meaningful HTTP status codes and typed error shapes.
 */
import { TRPCError } from '@trpc/server';

interface SzErrorLike extends Error {
  szCode?: string;
  code?: number;
  category?: string;
  severity?: string;
  isRetryable?(): boolean;
  isBadInput?(): boolean;
  isConfiguration?(): boolean;
  isLicense?(): boolean;
  isInitialization?(): boolean;
}

type TRPCErrorCode = ConstructorParameters<typeof TRPCError>[0]['code'];

function classifyError(err: SzErrorLike): TRPCErrorCode {
  if (err.isBadInput?.()) return 'BAD_REQUEST';
  if (err.isConfiguration?.()) return 'PRECONDITION_FAILED';
  if (err.isLicense?.()) return 'FORBIDDEN';
  if (err.isInitialization?.()) return 'PRECONDITION_FAILED';
  if (err.isRetryable?.()) return 'TOO_MANY_REQUESTS';
  return 'INTERNAL_SERVER_ERROR';
}

/**
 * Wraps a Senzing error (or any error) into a TRPCError with the
 * appropriate code and structured cause data.
 */
export function toTRPCError(err: unknown): TRPCError {
  if (err instanceof TRPCError) return err;

  const szErr = err as SzErrorLike;
  const code = classifyError(szErr);

  return new TRPCError({
    code,
    message: szErr.message ?? 'Unknown Senzing error',
    cause: {
      szCode: szErr.szCode,
      code: szErr.code,
      category: szErr.category,
      severity: szErr.severity,
    },
  });
}
