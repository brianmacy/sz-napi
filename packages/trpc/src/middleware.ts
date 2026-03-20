/**
 * Optional authentication middleware for Senzing tRPC routers.
 *
 * Consumers plug in their own verification function — no specific
 * auth scheme is enforced.
 *
 * @example
 * ```ts
 * import { t, createAuthMiddleware } from '@senzing/trpc';
 *
 * const requireAuth = createAuthMiddleware(async (token) => {
 *   const user = await verifyJwt(token);
 *   return !!user;
 * });
 *
 * const protectedRouter = t.router({
 *   sensitiveOp: t.procedure
 *     .use(requireAuth)
 *     .mutation(() => { ... }),
 * });
 * ```
 */
import { TRPCError } from '@trpc/server';
import { t } from './trpc.js';

/**
 * Creates a tRPC middleware that extracts a Bearer token from the
 * request headers and verifies it with the provided function.
 *
 * @param verify — Async function that returns `true` if the token is valid.
 */
export function createAuthMiddleware(verify: (token: string) => Promise<boolean>) {
  return t.middleware(async ({ ctx, next }) => {
    const headers = (ctx as any).__headers as Record<string, string | string[] | undefined> | undefined;
    const authHeader = headers?.authorization;
    const token = typeof authHeader === 'string'
      ? authHeader.replace(/^Bearer\s+/i, '')
      : undefined;

    if (!token) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Missing Authorization header',
      });
    }

    const valid = await verify(token);
    if (!valid) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    }

    return next({ ctx });
  });
}
