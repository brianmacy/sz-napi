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
export type { RecordKey } from './common.js';
export type { SzEngine } from './engine.js';
export type { SzConfigManager } from './config-manager.js';
export type { SzDiagnostic } from './diagnostic.js';
export type { SzProduct } from './product.js';
export type { SzEnvironment } from './environment.js';
