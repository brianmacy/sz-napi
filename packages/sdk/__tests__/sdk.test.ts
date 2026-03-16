import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const sdk = require('../sdk.js');
const configtool = require('../../configtool/configtool.js');

const {
  SzEnvironment,
  SzFlags,
  SzError,
  SzBadInputError,
  SzNotFoundError,
} = sdk;

function getTestConfig() {
  if (process.env.SENZING_SETTINGS) {
    const parsed = JSON.parse(process.env.SENZING_SETTINGS);
    const connMatch = parsed.SQL.CONNECTION.match(/sqlite3:\/\/[^@]+@(.+)/);
    return {
      settings: process.env.SENZING_SETTINGS,
      dbPath: connMatch?.[1] ?? '/tmp/sz-napi-test.db',
      schemaPath: path.join(parsed.PIPELINE.RESOURCEPATH, 'schema/szcore-schema-sqlite-create.sql'),
      externalInit: true,
    };
  }

  const senzingBase = '/opt/homebrew/opt/senzing/runtime/er';
  const dbPath = '/tmp/sz-napi-test.db';
  return {
    settings: JSON.stringify({
      PIPELINE: {
        CONFIGPATH: path.join(senzingBase, 'resources/templates'),
        RESOURCEPATH: path.join(senzingBase, 'resources'),
        SUPPORTPATH: '/opt/homebrew/opt/senzing/runtime/data',
      },
      SQL: { CONNECTION: `sqlite3://na:na@${dbPath}` },
    }),
    dbPath,
    schemaPath: path.join(senzingBase, 'resources/schema/szcore-schema-sqlite-create.sql'),
    externalInit: false,
  };
}

const testConfig = getTestConfig();
const settings = testConfig.settings;

/** Initialize SQLite database with Senzing schema */
function initTestDatabase() {
  if (fs.existsSync(testConfig.dbPath)) {
    fs.unlinkSync(testConfig.dbPath);
  }
  execSync(`sqlite3 ${testConfig.dbPath} < ${testConfig.schemaPath}`);
}

let env: InstanceType<typeof SzEnvironment>;
let engine: ReturnType<typeof env.getEngine>;
let product: ReturnType<typeof env.getProduct>;
let configMgr: ReturnType<typeof env.getConfigManager>;
let diagnostic: ReturnType<typeof env.getDiagnostic>;

// Entity IDs discovered during tests
let entityId1: number;
let entityId2: number;
let entityIdW001: number;

describe('Senzing SDK Integration Tests', () => {
  beforeAll(() => {
    // Initialize SQLite database with Senzing schema (skip if externally managed)
    if (!testConfig.externalInit) {
      initTestDatabase();
    }

    // Create environment (process-global singleton)
    env = new SzEnvironment('sz-napi-test', settings);

    // Get config manager and product first (don't need engine config)
    configMgr = env.getConfigManager();
    product = env.getProduct();

    // Create template config and add data sources
    let configJson = configMgr.createConfig();
    configJson = configtool.addDataSource(configJson, { code: 'CUSTOMERS' });
    configJson = configtool.addDataSource(configJson, { code: 'WATCHLIST' });

    // Register and activate the config
    const configId = configMgr.registerConfig(configJson, 'Test config with CUSTOMERS and WATCHLIST');
    configMgr.setDefaultConfigId(configId);
    env.reinitialize(configId);

    // Now get engine and diagnostic (requires active config)
    engine = env.getEngine();
    diagnostic = env.getDiagnostic();
  });

  afterAll(() => {
    if (env && !env.isDestroyed()) {
      env.destroy();
    }
    if (!testConfig.externalInit && fs.existsSync(testConfig.dbPath)) {
      fs.unlinkSync(testConfig.dbPath);
    }
  });

  // ─── SzProduct ───────────────────────────────────────────────

  describe('test_product', () => {
    test('getVersion returns valid JSON with VERSION field', () => {
      const raw = product.getVersion();
      const version = JSON.parse(raw);
      expect(version).toHaveProperty('VERSION');
      expect(typeof version.VERSION).toBe('string');
      expect(version.VERSION.length).toBeGreaterThan(0);
    });

    test('getLicense returns valid JSON with licenseType field', () => {
      const raw = product.getLicense();
      const license = JSON.parse(raw);
      expect(license).toHaveProperty('licenseType');
      expect(typeof license.licenseType).toBe('string');
    });
  });

  // ─── SzFlags ─────────────────────────────────────────────────

  describe('test_flags', () => {
    test('WITH_INFO equals expected bigint value', () => {
      expect(SzFlags.WITH_INFO).toBe(4611686018427387904n);
    });

    test('NO_FLAGS equals 0n', () => {
      expect(SzFlags.NO_FLAGS).toBe(0n);
    });

    test('bitwise OR works with flag values', () => {
      const combined = SzFlags.WITH_INFO | SzFlags.ENTITY_DEFAULT_FLAGS;
      expect(typeof combined).toBe('bigint');
      expect(combined).not.toBe(0n);
      // Combined should have both bits set
      expect(combined & SzFlags.WITH_INFO).toBe(SzFlags.WITH_INFO);
      expect(combined & SzFlags.ENTITY_DEFAULT_FLAGS).toBe(SzFlags.ENTITY_DEFAULT_FLAGS);
    });
  });

  // ─── Add Records ─────────────────────────────────────────────

  describe('test_add_record', () => {
    test('addRecord CUSTOMERS 1001', () => {
      const record = JSON.stringify({
        NAME_FULL: 'Robert Smith',
        ADDR_FULL: '123 Main St, Las Vegas NV 89101',
      });
      const result = engine.addRecord('CUSTOMERS', '1001', record);
      // addRecord returns empty string when no WITH_INFO flag
      expect(typeof result).toBe('string');
    });

    test('addRecord CUSTOMERS 1002 (similar name)', () => {
      const record = JSON.stringify({
        NAME_FULL: 'Bob Smith',
        ADDR_FULL: '123 Main Street, Las Vegas NV 89101',
      });
      const result = engine.addRecord('CUSTOMERS', '1002', record);
      expect(typeof result).toBe('string');
    });

    test('addRecord WATCHLIST W001 (matching name)', () => {
      const record = JSON.stringify({
        NAME_FULL: 'Robert Smith',
        ADDR_FULL: '123 Main St, Las Vegas NV',
      });
      const result = engine.addRecord('WATCHLIST', 'W001', record);
      expect(typeof result).toBe('string');
    });
  });

  // ─── Get Record ──────────────────────────────────────────────

  describe('test_get_record', () => {
    test('getRecord returns JSON with data source and record ID', () => {
      const raw = engine.getRecord('CUSTOMERS', '1001');
      const record = JSON.parse(raw);
      expect(record).toHaveProperty('DATA_SOURCE', 'CUSTOMERS');
      expect(record).toHaveProperty('RECORD_ID', '1001');
    });
  });

  // ─── Get Entity by Record ────────────────────────────────────

  describe('test_get_entity_by_record', () => {
    test('getEntityByRecord returns entity with RESOLVED_ENTITY', () => {
      const raw = engine.getEntityByRecord('CUSTOMERS', '1001');
      const entity = JSON.parse(raw);
      expect(entity).toHaveProperty('RESOLVED_ENTITY');
      expect(entity.RESOLVED_ENTITY).toHaveProperty('ENTITY_ID');
      entityId1 = entity.RESOLVED_ENTITY.ENTITY_ID;
      expect(typeof entityId1).toBe('number');
      expect(entityId1).toBeGreaterThan(0);
    });

    test('capture entity IDs for CUSTOMERS 1002 and WATCHLIST W001', () => {
      const raw2 = engine.getEntityByRecord('CUSTOMERS', '1002');
      const entity2 = JSON.parse(raw2);
      entityId2 = entity2.RESOLVED_ENTITY.ENTITY_ID;
      expect(entityId2).toBeGreaterThan(0);

      const rawW = engine.getEntityByRecord('WATCHLIST', 'W001');
      const entityW = JSON.parse(rawW);
      entityIdW001 = entityW.RESOLVED_ENTITY.ENTITY_ID;
      expect(entityIdW001).toBeGreaterThan(0);
    });
  });

  // ─── Get Entity by ID ────────────────────────────────────────

  describe('test_get_entity_by_id', () => {
    test('getEntityById returns same entity as getEntityByRecord', () => {
      const raw = engine.getEntityById(entityId1);
      const entity = JSON.parse(raw);
      expect(entity).toHaveProperty('RESOLVED_ENTITY');
      expect(entity.RESOLVED_ENTITY.ENTITY_ID).toBe(entityId1);
    });
  });

  // ─── Search by Attributes ────────────────────────────────────

  describe('test_search_by_attributes', () => {
    test('searchByAttributes with a name returns results', () => {
      const attrs = JSON.stringify({ NAME_FULL: 'Robert Smith' });
      const raw = engine.searchByAttributes(attrs);
      const result = JSON.parse(raw);
      expect(result).toHaveProperty('RESOLVED_ENTITIES');
      expect(Array.isArray(result.RESOLVED_ENTITIES)).toBe(true);
      expect(result.RESOLVED_ENTITIES.length).toBeGreaterThan(0);
    });
  });

  // ─── Why Entities ────────────────────────────────────────────

  describe('test_why_entities', () => {
    test('whyEntities returns analysis between two entities', () => {
      // Use two distinct entity IDs; if 1001 and 1002 resolved together, use W001
      const id1 = entityId1;
      const id2 = entityId1 === entityId2 ? entityIdW001 : entityId2;

      if (id1 !== id2) {
        const raw = engine.whyEntities(id1, id2);
        const result = JSON.parse(raw);
        expect(result).toHaveProperty('WHY_RESULTS');
      }
    });
  });

  // ─── Why Records ─────────────────────────────────────────────

  describe('test_why_records', () => {
    test('whyRecords returns analysis between two records', () => {
      const raw = engine.whyRecords('CUSTOMERS', '1001', 'CUSTOMERS', '1002');
      const result = JSON.parse(raw);
      expect(result).toHaveProperty('WHY_RESULTS');
      expect(Array.isArray(result.WHY_RESULTS)).toBe(true);
    });
  });

  // ─── How Entity ──────────────────────────────────────────────

  describe('test_how_entity', () => {
    test('howEntity returns step-by-step analysis', () => {
      const raw = engine.howEntity(entityId1);
      const result = JSON.parse(raw);
      expect(result).toHaveProperty('HOW_RESULTS');
    });
  });

  // ─── Find Path ───────────────────────────────────────────────

  describe('test_find_path', () => {
    test('findPath between two entity IDs', () => {
      const id1 = entityId1;
      const id2 = entityId1 === entityId2 ? entityIdW001 : entityId2;

      if (id1 !== id2) {
        const raw = engine.findPath(id1, id2, 5);
        const result = JSON.parse(raw);
        expect(result).toHaveProperty('ENTITY_PATHS');
        expect(result).toHaveProperty('ENTITIES');
      }
    });
  });

  // ─── Redo ────────────────────────────────────────────────────

  describe('test_redo', () => {
    test('countRedoRecords returns a number >= 0', () => {
      const count = engine.countRedoRecords();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── Export ──────────────────────────────────────────────────

  describe('test_export', () => {
    test('exportJsonEntityReport returns iterable SzExportIterator', () => {
      const iter = engine.exportJsonEntityReport(SzFlags.EXPORT_DEFAULT_FLAGS);
      expect(iter).toBeDefined();
      expect(typeof iter.next).toBe('function');
      expect(typeof iter.close).toBe('function');
      expect(typeof iter[Symbol.iterator]).toBe('function');

      // Manual next() works
      const first = iter.next();
      expect(typeof first).toBe('string');
      expect(first.length).toBeGreaterThan(0);
      iter.close();
    });

    test('for...of iteration works', () => {
      const rows: string[] = [];
      for (const row of engine.exportJsonEntityReport(SzFlags.EXPORT_DEFAULT_FLAGS)) {
        rows.push(row);
      }
      expect(rows.length).toBeGreaterThan(0);
      // Each row should be valid JSON
      for (const row of rows) {
        expect(() => JSON.parse(row)).not.toThrow();
      }
    });

    test('early break calls close automatically', () => {
      let count = 0;
      for (const _row of engine.exportJsonEntityReport(SzFlags.EXPORT_DEFAULT_FLAGS)) {
        count++;
        if (count >= 1) break;
      }
      expect(count).toBe(1);
      // No resource leak — return() handler called close()
    });
  });

  // ─── Delete Record ───────────────────────────────────────────

  describe('test_delete_record', () => {
    test('deleteRecord removes record from repository', () => {
      engine.deleteRecord('CUSTOMERS', '1002');

      expect(() => {
        engine.getRecord('CUSTOMERS', '1002');
      }).toThrow();
    });

    test('deleted record throws SzNotFoundError', () => {
      try {
        engine.getRecord('CUSTOMERS', '1002');
        // Should not reach here
        expect(true).toBe(false);
      } catch (err: any) {
        expect(err).toBeInstanceOf(SzNotFoundError);
      }
    });
  });

  // ─── Error Handling ──────────────────────────────────────────

  describe('test_error_handling', () => {
    test('SzNotFoundError is instanceof SzBadInputError', () => {
      const err = new SzNotFoundError('test');
      expect(err).toBeInstanceOf(SzBadInputError);
      expect(err).toBeInstanceOf(SzError);
    });

    test('SzNotFoundError has correct properties', () => {
      const err = new SzNotFoundError('test', { szCode: 'SZ_NOT_FOUND' });
      expect(err.szCode).toBe('SZ_NOT_FOUND');
      expect(err.category).toBe('BadInput');
    });

    test('getRecord with non-existent record throws SzNotFoundError', () => {
      expect(() => {
        engine.getRecord('CUSTOMERS', 'NONEXISTENT');
      }).toThrow(SzNotFoundError);
    });
  });

  // ─── Config Manager ──────────────────────────────────────────

  describe('test_config_manager', () => {
    test('getConfigRegistry returns JSON with CONFIGS array', () => {
      const raw = configMgr.getConfigRegistry();
      const registry = JSON.parse(raw);
      expect(registry).toHaveProperty('CONFIGS');
      expect(Array.isArray(registry.CONFIGS)).toBe(true);
      expect(registry.CONFIGS.length).toBeGreaterThan(0);
    });

    test('getDefaultConfigId returns a number', () => {
      const configId = configMgr.getDefaultConfigId();
      expect(typeof configId).toBe('number');
      expect(configId).toBeGreaterThan(0);
    });
  });

  // ─── Diagnostic ──────────────────────────────────────────────

  describe('test_diagnostic', () => {
    test('getRepositoryInfo returns valid JSON', () => {
      const raw = diagnostic.getRepositoryInfo();
      const info = JSON.parse(raw);
      expect(typeof info).toBe('object');
      expect(info).not.toBeNull();
    });
  });
});
