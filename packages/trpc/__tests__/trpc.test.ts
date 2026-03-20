import { describe, test, expect, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { toTRPCError } from '../src/errors.js';
import { szCall } from '../src/sz-call.js';
import { wrapClient } from '../src/wrapper.js';
import { METHOD_REGISTRY, METHOD_MAP } from '../src/methods.js';
import * as schemas from '../src/schemas.js';

// -- toTRPCError ----------------------------------------------------------

describe('toTRPCError', () => {
  test('maps bad input errors to BAD_REQUEST', () => {
    const szErr = Object.assign(new Error('bad input'), {
      isBadInput: () => true,
      isRetryable: () => false,
      isConfiguration: () => false,
      isLicense: () => false,
      isInitialization: () => false,
      szCode: 'SZ_BAD_INPUT',
      category: 'BadInput',
      severity: 'Warning',
    });
    const result = toTRPCError(szErr);
    expect(result).toBeInstanceOf(TRPCError);
    expect(result.code).toBe('BAD_REQUEST');
    expect(result.cause).toEqual(expect.objectContaining({ szCode: 'SZ_BAD_INPUT' }));
  });

  test('maps not-found errors to NOT_FOUND', () => {
    const szErr = Object.assign(new Error('record not found'), {
      isBadInput: () => true,
      isRetryable: () => false,
      isConfiguration: () => false,
      isLicense: () => false,
      isInitialization: () => false,
      szCode: 'SZ_NOT_FOUND',
      category: 'BadInput',
      severity: 'Warning',
    });
    const result = toTRPCError(szErr);
    expect(result.code).toBe('NOT_FOUND');
  });

  test('maps retryable errors to TOO_MANY_REQUESTS', () => {
    const szErr = Object.assign(new Error('retry'), {
      isBadInput: () => false,
      isRetryable: () => true,
      isConfiguration: () => false,
      isLicense: () => false,
      isInitialization: () => false,
      szCode: 'SZ_RETRYABLE',
      category: 'Retryable',
      severity: 'Warning',
    });
    const result = toTRPCError(szErr);
    expect(result.code).toBe('TOO_MANY_REQUESTS');
  });

  test('maps license errors to FORBIDDEN', () => {
    const szErr = Object.assign(new Error('license'), {
      isBadInput: () => false,
      isRetryable: () => false,
      isConfiguration: () => false,
      isLicense: () => true,
      isInitialization: () => false,
      szCode: 'SZ_LICENSE',
      category: 'License',
      severity: 'Critical',
    });
    const result = toTRPCError(szErr);
    expect(result.code).toBe('FORBIDDEN');
  });

  test('maps configuration errors to PRECONDITION_FAILED', () => {
    const szErr = Object.assign(new Error('config'), {
      isBadInput: () => false,
      isRetryable: () => false,
      isConfiguration: () => true,
      isLicense: () => false,
      isInitialization: () => false,
      szCode: 'SZ_CONFIG',
      category: 'Configuration',
      severity: 'Error',
    });
    const result = toTRPCError(szErr);
    expect(result.code).toBe('PRECONDITION_FAILED');
  });

  test('maps initialization errors to PRECONDITION_FAILED', () => {
    const szErr = Object.assign(new Error('not init'), {
      isBadInput: () => false,
      isRetryable: () => false,
      isConfiguration: () => false,
      isLicense: () => false,
      isInitialization: () => true,
      szCode: 'SZ_NOT_INIT',
      category: 'Initialization',
      severity: 'Critical',
    });
    const result = toTRPCError(szErr);
    expect(result.code).toBe('PRECONDITION_FAILED');
  });

  test('maps unknown errors to INTERNAL_SERVER_ERROR', () => {
    const err = new Error('unexpected');
    const result = toTRPCError(err);
    expect(result.code).toBe('INTERNAL_SERVER_ERROR');
  });

  test('passes through TRPCError unchanged', () => {
    const original = new TRPCError({ code: 'NOT_FOUND', message: 'nope' });
    const result = toTRPCError(original);
    expect(result).toBe(original);
  });

  test('preserves cause metadata', () => {
    const szErr = Object.assign(new Error('test'), {
      isBadInput: () => true,
      isRetryable: () => false,
      isConfiguration: () => false,
      isLicense: () => false,
      isInitialization: () => false,
      szCode: 'SZ_001',
      code: 1001,
      category: 'BadInput',
      severity: 'Warning',
    });
    const result = toTRPCError(szErr);
    // tRPC wraps cause in an UnknownCauseError, so use objectContaining
    expect(result.cause).toEqual(expect.objectContaining({
      szCode: 'SZ_001',
      code: 1001,
      category: 'BadInput',
      severity: 'Warning',
    }));
  });
});

// -- szCall ---------------------------------------------------------------

describe('szCall', () => {
  test('returns value from successful function', () => {
    const result = szCall(() => 42);
    expect(result).toBe(42);
  });

  test('returns complex values', () => {
    const obj = { foo: 'bar' };
    const result = szCall(() => obj);
    expect(result).toBe(obj);
  });

  test('converts SzError-like errors to TRPCError', () => {
    const szErr = Object.assign(new Error('bad'), {
      isBadInput: () => true,
      isRetryable: () => false,
      isConfiguration: () => false,
      isLicense: () => false,
      isInitialization: () => false,
      szCode: 'SZ_BAD',
    });
    expect(() => szCall(() => { throw szErr; })).toThrow(TRPCError);
  });

  test('wraps plain errors as INTERNAL_SERVER_ERROR', () => {
    try {
      szCall(() => { throw new Error('oops'); });
    } catch (err) {
      expect(err).toBeInstanceOf(TRPCError);
      expect((err as TRPCError).code).toBe('INTERNAL_SERVER_ERROR');
    }
  });
});

// -- wrapClient -----------------------------------------------------------

describe('wrapClient', () => {
  test('zips positional args to named object for mutations', async () => {
    const mockMutate = vi.fn().mockResolvedValue({ success: true });
    const mockClient = {
      engine: {
        addRecord: { mutate: mockMutate },
      },
    };
    const wrapped = wrapClient(mockClient);
    await wrapped.engine.addRecord('DS', '1', '{"NAME":"Bob"}', 0n);
    expect(mockMutate).toHaveBeenCalledWith({
      dataSourceCode: 'DS',
      recordId: '1',
      recordDefinition: '{"NAME":"Bob"}',
      flags: 0n,
    });
  });

  test('zips positional args for queries', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ entity: true });
    const mockClient = {
      engine: {
        getEntityById: { query: mockQuery },
      },
    };
    const wrapped = wrapClient(mockClient);
    await wrapped.engine.getEntityById(42, 1n);
    expect(mockQuery).toHaveBeenCalledWith({
      entityId: 42,
      flags: 1n,
    });
  });

  test('calls query() for no-arg query methods', async () => {
    const mockQuery = vi.fn().mockResolvedValue('v1.0');
    const mockClient = {
      product: {
        getVersion: { query: mockQuery },
      },
    };
    const wrapped = wrapClient(mockClient);
    await wrapped.product.getVersion();
    expect(mockQuery).toHaveBeenCalledWith();
  });

  test('passes through unknown services', () => {
    const mockClient = {
      unknown: { foo: 'bar' },
    };
    const wrapped = wrapClient(mockClient);
    expect(wrapped.unknown).toEqual({ foo: 'bar' });
  });

  test('passes through unknown methods on known services', () => {
    const mockClient = {
      engine: {
        unknownMethod: 'test',
        addRecord: { mutate: vi.fn() },
      },
    };
    const wrapped = wrapClient(mockClient);
    expect(wrapped.engine.unknownMethod).toBe('test');
  });

  test('handles optional args (undefined omitted)', async () => {
    const mockQuery = vi.fn().mockResolvedValue([]);
    const mockClient = {
      engine: {
        searchByAttributes: { query: mockQuery },
      },
    };
    const wrapped = wrapClient(mockClient);
    await wrapped.engine.searchByAttributes('{"NAME":"Bob"}');
    expect(mockQuery).toHaveBeenCalledWith({
      attributes: '{"NAME":"Bob"}',
    });
  });
});

// -- METHOD_REGISTRY ------------------------------------------------------

describe('METHOD_REGISTRY', () => {
  test('has no duplicate entries', () => {
    const keys = METHOD_REGISTRY.map(d => `${d.service}.${d.method}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  test('every entry has valid type', () => {
    for (const def of METHOD_REGISTRY) {
      expect(['query', 'mutation']).toContain(def.type);
    }
  });

  test('METHOD_MAP has same count as METHOD_REGISTRY', () => {
    expect(METHOD_MAP.size).toBe(METHOD_REGISTRY.length);
  });

  test('covers all expected services', () => {
    const services = new Set(METHOD_REGISTRY.map(d => d.service));
    expect(services).toEqual(new Set(['product', 'engine', 'configManager', 'diagnostic', 'environment']));
  });

  test('every entry has string array args', () => {
    for (const def of METHOD_REGISTRY) {
      expect(Array.isArray(def.args)).toBe(true);
      for (const arg of def.args) {
        expect(typeof arg).toBe('string');
      }
    }
  });
});

// -- Zod Schemas ----------------------------------------------------------

describe('Zod schemas', () => {
  test('addRecord accepts valid input', () => {
    const result = schemas.addRecord.safeParse({
      dataSourceCode: 'DS',
      recordId: '1',
      recordDefinition: '{"NAME":"Bob"}',
      flags: 0n,
    });
    expect(result.success).toBe(true);
  });

  test('addRecord rejects missing required fields', () => {
    const result = schemas.addRecord.safeParse({
      dataSourceCode: 'DS',
    });
    expect(result.success).toBe(false);
  });

  test('flags accepts bigint', () => {
    const result = schemas.flags.safeParse(1n << 62n);
    expect(result.success).toBe(true);
  });

  test('flags accepts undefined', () => {
    const result = schemas.flags.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  test('findPath accepts optional arrays', () => {
    const result = schemas.findPath.safeParse({
      startEntityId: 1,
      endEntityId: 2,
      maxDegrees: 3,
      avoidEntityIds: [4, 5],
      requiredDataSources: ['DS1'],
      flags: 0n,
    });
    expect(result.success).toBe(true);
  });

  test('findPath accepts null optional arrays', () => {
    const result = schemas.findPath.safeParse({
      startEntityId: 1,
      endEntityId: 2,
      maxDegrees: 3,
    });
    expect(result.success).toBe(true);
  });

  test('searchByAttributes handles nullish searchProfile', () => {
    const result = schemas.searchByAttributes.safeParse({
      attributes: '{"NAME":"Bob"}',
      searchProfile: null,
    });
    expect(result.success).toBe(true);
  });

  test('getEntityById requires entityId', () => {
    const result = schemas.getEntityById.safeParse({});
    expect(result.success).toBe(false);
  });

  test('recordKey validates structure', () => {
    expect(schemas.recordKey.safeParse({ dataSourceCode: 'DS', recordId: '1' }).success).toBe(true);
    expect(schemas.recordKey.safeParse({ dataSourceCode: 'DS' }).success).toBe(false);
  });
});
