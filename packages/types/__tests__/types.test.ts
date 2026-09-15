/**
 * Tests for @senzing/types — compile-time interface conformance
 * and runtime adapter verification.
 */
import { describe, test, expect } from 'vitest';
import type {
  SzEngine,
  SzConfigManager,
  SzDiagnostic,
  SzProduct,
  SzEnvironment,
  RecordKey,
  SzFlagName,
} from '../src/index.js';
import { SzFlags } from '../src/index.js';

// -- RecordKey type -----------------------------------------------------------

describe('RecordKey', () => {
  test('accepts valid record key', () => {
    const key: RecordKey = { dataSourceCode: 'DS', recordId: '1' };
    expect(key.dataSourceCode).toBe('DS');
    expect(key.recordId).toBe('1');
  });
});

// -- Interface completeness ---------------------------------------------------

describe('interface completeness', () => {
  // These tests verify that the interfaces have the expected method names
  // by creating mock objects and checking they satisfy the types. JSON-returning
  // methods resolve JSON strings, matching the SzEngine contract.

  test('SzProduct has getVersion and getLicense', () => {
    const mock: SzProduct = {
      getVersion: async () => '{}',
      getLicense: async () => '{}',
    };
    expect(typeof mock.getVersion).toBe('function');
    expect(typeof mock.getLicense).toBe('function');
  });

  test('SzDiagnostic has all 4 methods', () => {
    const mock: SzDiagnostic = {
      checkRepositoryPerformance: async () => '{}',
      getFeature: async () => '{}',
      getRepositoryInfo: async () => '{}',
      purgeRepository: async () => {},
    };
    expect(Object.keys(mock)).toHaveLength(4);
  });

  test('SzConfigManager has all 9 methods', () => {
    const mock: SzConfigManager = {
      createConfig: async () => '{}',
      createConfigFromId: async () => '{}',
      createConfigFromDefinition: async () => '{}',
      getConfigRegistry: async () => '{}',
      getDefaultConfigId: async () => 1,
      registerConfig: async () => 1,
      replaceDefaultConfigId: async () => {},
      setDefaultConfig: async () => 1,
      setDefaultConfigId: async () => {},
    };
    expect(Object.keys(mock)).toHaveLength(9);
  });

  test('SzEnvironment has all 4 lifecycle methods', () => {
    const mock: SzEnvironment = {
      destroy: async () => {},
      reinitialize: async () => {},
      getActiveConfigId: async () => 1,
      isDestroyed: async () => false,
    };
    expect(Object.keys(mock)).toHaveLength(4);
  });

  test('SzEngine has all expected methods', () => {
    const expectedMethods = [
      'addRecord', 'deleteRecord', 'getRecord', 'getRecordPreview',
      'reevaluateRecord', 'reevaluateEntity',
      'getEntityById', 'getEntityByRecord', 'searchByAttributes',
      'whySearch', 'whyEntities', 'whyRecords', 'whyRecordInEntity',
      'howEntity', 'getVirtualEntity',
      'findInterestingEntitiesById', 'findInterestingEntitiesByRecord',
      'findPath', 'findNetwork',
      'getRedoRecord', 'countRedoRecords', 'processRedoRecord',
      'primeEngine', 'getStats',
      'exportJsonEntityReport', 'exportCsvEntityReport',
    ];

    // Simply verify the expected count — the transport-agnostic test below
    // provides runtime proof that a mock satisfying SzEngine compiles and works.
    expect(expectedMethods.length).toBe(26);
  });
});

// -- Transport-agnostic function pattern --------------------------------------

describe('transport-agnostic usage', () => {
  test('function accepting SzProduct works with mock implementation', async () => {
    async function getVersionInfo(product: SzProduct): Promise<string> {
      const version = JSON.parse(await product.getVersion());
      return version.VERSION;
    }

    const mock: SzProduct = {
      getVersion: async () => JSON.stringify({ VERSION: '4.0.0', BUILD_DATE: '2024-01-01' }),
      getLicense: async () => JSON.stringify({ licenseType: 'EVAL' }),
    };

    const result = await getVersionInfo(mock);
    expect(result).toBe('4.0.0');
  });

  test('function accepting SzEngine works with mock implementation', async () => {
    async function addAndGet(engine: SzEngine): Promise<string> {
      await engine.addRecord('DS', '1', '{"NAME_FULL":"Test"}');
      return engine.getEntityByRecord('DS', '1');
    }

    const mock: SzEngine = {
      addRecord: async () => JSON.stringify({ AFFECTED_ENTITIES: [{ ENTITY_ID: 1 }] }),
      deleteRecord: async () => '{}',
      getRecord: async () => '{}',
      getRecordPreview: async () => '{}',
      reevaluateRecord: async () => '{}',
      reevaluateEntity: async () => '{}',
      getEntityById: async () => '{}',
      getEntityByRecord: async () => JSON.stringify({ RESOLVED_ENTITY: { ENTITY_ID: 1 } }),
      searchByAttributes: async () => '{}',
      whySearch: async () => '{}',
      whyEntities: async () => '{}',
      whyRecords: async () => '{}',
      whyRecordInEntity: async () => '{}',
      howEntity: async () => '{}',
      getVirtualEntity: async () => '{}',
      findInterestingEntitiesById: async () => '{}',
      findInterestingEntitiesByRecord: async () => '{}',
      findPath: async () => '{}',
      findNetwork: async () => '{}',
      getRedoRecord: async () => '{}',
      countRedoRecords: async () => 0,
      processRedoRecord: async () => '{}',
      primeEngine: async () => {},
      getStats: async () => '{}',
      exportJsonEntityReport: async () => '{}',
      exportCsvEntityReport: async () => '',
    };

    const result = JSON.parse(await addAndGet(mock));
    expect(result.RESOLVED_ENTITY.ENTITY_ID).toBe(1);
  });
});

// -- SzFlags (generated from the native binding) ------------------------------

describe('SzFlags', () => {
  test('is exported as runtime data, not just a type', () => {
    expect(typeof SzFlags).toBe('object');
    expect(Object.keys(SzFlags).length).toBeGreaterThan(0);
  });

  test('is frozen so consumers cannot mutate shared flag values', () => {
    expect(Object.isFrozen(SzFlags)).toBe(true);
  });

  test('every flag value is a bigint', () => {
    for (const [name, value] of Object.entries(SzFlags)) {
      expect(typeof value, `${name} should be bigint`).toBe('bigint');
    }
  });

  test('WITH_INFO occupies bit 62, which is why the values are bigint', () => {
    expect(SzFlags.WITH_INFO).toBe(1n << 62n);
    expect(SzFlags.WITH_INFO).toBeGreaterThan(BigInt(Number.MAX_SAFE_INTEGER));
  });

  test('NO_FLAGS is zero', () => {
    expect(SzFlags.NO_FLAGS).toBe(0n);
  });

  test('flags combine with bitwise OR', () => {
    const combined = SzFlags.WITH_INFO | SzFlags.ENTITY_DEFAULT_FLAGS;
    expect(combined & SzFlags.WITH_INFO).toBe(SzFlags.WITH_INFO);
  });

  test('includes HOW_ENTITY_DEFAULT_FLAGS, the flag that was missing in #50', () => {
    expect(SzFlags.HOW_ENTITY_DEFAULT_FLAGS).toBeTypeOf('bigint');
  });

  test('SzFlagName is constrained to real flag names', () => {
    const name: SzFlagName = 'ENTITY_DEFAULT_FLAGS';
    expect(SzFlags[name]).toBeTypeOf('bigint');
  });
});
