/**
 * @senzing/types — Shared TypeScript interfaces for Senzing SDK transports.
 *
 * These interfaces define the canonical Senzing API contract. All transport
 * implementations (native, tRPC, Electron) satisfy these interfaces.
 *
 * @example Transport-agnostic consumer code
 * ```typescript
 * import type { SzEngine } from '@senzing/types';
 *
 * async function investigate(engine: SzEngine) {
 *   const entity = await engine.getEntityById(123);
 *   const path = await engine.findPath(1, 2, 5);
 * }
 * ```
 */
export type { JsonString, RecordKey } from './common.js';
export type { SzEngine } from './engine.js';
export type { SzConfigManager } from './config-manager.js';
export type { SzDiagnostic } from './diagnostic.js';
export type { SzProduct } from './product.js';
export type { SzEnvironment } from './environment.js';

// Runtime flag constants, generated from the native binding. Exported as values
// (not types) so a consumer without @senzing/sdk can still name its flags.
export { SzFlags } from './flags.generated.js';
export type { SzFlagName } from './flags.generated.js';
