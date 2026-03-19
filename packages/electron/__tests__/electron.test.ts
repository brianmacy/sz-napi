/**
 * Unit tests for @senzing/electron shared utilities.
 *
 * These tests cover pure functions that don't require Electron or the Senzing runtime.
 */
import { describe, test, expect } from 'vitest';

// -- toBigIntFlag ---------------------------------------------------------

describe('toBigIntFlag', () => {
  // Import inline to avoid top-level import issues
  let toBigIntFlag: (value: unknown) => bigint | undefined;

  test('module imports successfully', async () => {
    const mod = await import('../src/shared/flags');
    toBigIntFlag = mod.toBigIntFlag;
    expect(typeof toBigIntFlag).toBe('function');
  });

  test('converts number to bigint', async () => {
    const mod = await import('../src/shared/flags');
    expect(mod.toBigIntFlag(42)).toBe(42n);
  });

  test('passes through bigint unchanged', async () => {
    const mod = await import('../src/shared/flags');
    expect(mod.toBigIntFlag(99n)).toBe(99n);
  });

  test('returns undefined for undefined', async () => {
    const mod = await import('../src/shared/flags');
    expect(mod.toBigIntFlag(undefined)).toBeUndefined();
  });

  test('returns undefined for null', async () => {
    const mod = await import('../src/shared/flags');
    expect(mod.toBigIntFlag(null)).toBeUndefined();
  });

  test('converts zero', async () => {
    const mod = await import('../src/shared/flags');
    expect(mod.toBigIntFlag(0)).toBe(0n);
  });

  test('converts large numbers', async () => {
    const mod = await import('../src/shared/flags');
    expect(mod.toBigIntFlag(Number.MAX_SAFE_INTEGER)).toBe(BigInt(Number.MAX_SAFE_INTEGER));
  });
});

// -- Error serialization round-trip ---------------------------------------

// These tests require @senzing/sdk (native module). Skip if not available.
let sdkAvailable = false;
try {
  require('@senzing/sdk');
  sdkAvailable = true;
} catch {
  // SDK not available
}

const describeIfSdk = sdkAvailable ? describe : describe.skip;

describeIfSdk('Error serialization round-trip', () => {
  let serializeSzError: any;
  let deserializeSzError: any;
  let errorClasses: Record<string, any>;

  test('imports error utilities', async () => {
    const mod = await import('../src/shared/errors');
    serializeSzError = mod.serializeSzError;
    deserializeSzError = mod.deserializeSzError;

    const sdk = require('@senzing/sdk');
    errorClasses = {
      SzBadInputError: sdk.SzBadInputError,
      SzNotFoundError: sdk.SzNotFoundError,
      SzUnknownDataSourceError: sdk.SzUnknownDataSourceError,
      SzConfigurationError: sdk.SzConfigurationError,
      SzRetryableError: sdk.SzRetryableError,
      SzDatabaseConnectionLostError: sdk.SzDatabaseConnectionLostError,
      SzDatabaseTransientError: sdk.SzDatabaseTransientError,
      SzRetryTimeoutExceededError: sdk.SzRetryTimeoutExceededError,
      SzUnrecoverableError: sdk.SzUnrecoverableError,
      SzDatabaseError: sdk.SzDatabaseError,
      SzLicenseError: sdk.SzLicenseError,
      SzNotInitializedError: sdk.SzNotInitializedError,
      SzUnhandledError: sdk.SzUnhandledError,
      SzReplaceConflictError: sdk.SzReplaceConflictError,
      SzEnvironmentDestroyedError: sdk.SzEnvironmentDestroyedError,
    };
  });

  const errorTestCases = [
    ['SzBadInputError', 'BadInput', 'Warning'],
    ['SzNotFoundError', 'BadInput', 'Warning'],
    ['SzUnknownDataSourceError', 'BadInput', 'Warning'],
    ['SzConfigurationError', 'Configuration', 'Error'],
    ['SzRetryableError', 'Retryable', 'Warning'],
    ['SzDatabaseConnectionLostError', 'Retryable', 'Warning'],
    ['SzDatabaseTransientError', 'Retryable', 'Warning'],
    ['SzRetryTimeoutExceededError', 'Retryable', 'Warning'],
    ['SzUnrecoverableError', 'Unrecoverable', 'Critical'],
    ['SzDatabaseError', 'Unrecoverable', 'Critical'],
    ['SzLicenseError', 'Unrecoverable', 'Critical'],
    ['SzNotInitializedError', 'Unrecoverable', 'Critical'],
    ['SzUnhandledError', 'Unrecoverable', 'Critical'],
    ['SzReplaceConflictError', 'ReplaceConflict', 'Warning'],
    ['SzEnvironmentDestroyedError', 'EnvironmentDestroyed', 'Error'],
  ] as const;

  for (const [className, category, severity] of errorTestCases) {
    test(`round-trips ${className}`, () => {
      const Ctor = errorClasses[className];
      if (!Ctor) {
        // Skip if this specific error class isn't available
        return;
      }

      const original = new Ctor(`test ${className}`, {
        szCode: `SZ_${className.toUpperCase()}`,
        code: 1001,
        component: 'test',
        category,
        severity,
      });

      const serialized = serializeSzError(original);
      expect(serialized.className).toBe(className);
      expect(serialized.message).toBe(`test ${className}`);
      expect(serialized.szCode).toBe(`SZ_${className.toUpperCase()}`);
      expect(serialized.category).toBe(category);
      expect(serialized.severity).toBe(severity);

      const deserialized = deserializeSzError(serialized);
      expect(deserialized).toBeInstanceOf(Ctor);
      expect(deserialized.message).toBe(original.message);
      expect(deserialized.szCode).toBe(original.szCode);
      expect(deserialized.category).toBe(category);
      expect(deserialized.severity).toBe(severity);
    });
  }

  test('unknown class falls back to SzError', () => {
    const sdk = require('@senzing/sdk');
    const serialized = {
      className: 'SzSomeNewError',
      message: 'unknown error type',
      szCode: 'SZ_UNKNOWN',
      category: 'Unknown',
      severity: 'Warning',
    };
    const deserialized = deserializeSzError(serialized);
    expect(deserialized).toBeInstanceOf(sdk.SzError);
    expect(deserialized.message).toBe('unknown error type');
  });
});

// -- SERVICE_METHODS completeness (if @senzing/trpc is available) ---------

let trpcAvailable = false;
try {
  require('@senzing/trpc');
  trpcAvailable = true;
} catch {
  // trpc not available
}

const describeIfTrpc = trpcAvailable ? describe : describe.skip;

describeIfTrpc('SERVICE_METHODS derived from METHOD_REGISTRY', () => {
  test('has all expected services', async () => {
    const { METHOD_REGISTRY } = await import('@senzing/trpc');

    const services: Record<string, string[]> = {};
    for (const def of METHOD_REGISTRY) {
      (services[def.service] ??= []).push(def.method);
    }

    expect(Object.keys(services).sort()).toEqual(
      ['configManager', 'diagnostic', 'engine', 'environment', 'product']
    );
  });

  test('engine has the most methods', async () => {
    const { METHOD_REGISTRY } = await import('@senzing/trpc');

    const engineMethods = METHOD_REGISTRY.filter(d => d.service === 'engine');
    expect(engineMethods.length).toBeGreaterThan(20);
  });
});
