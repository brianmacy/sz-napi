/**
 * Integration tests for native SDK adapter classes.
 *
 * Verifies that SzEngineNative, SzConfigManagerNative, etc. correctly
 * wrap synchronous native SDK calls into the @senzing/types async interface.
 *
 * Requires Senzing runtime to be installed.
 */
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const sdk = require('../sdk.js');
const configtool = require('../../configtool/configtool.js');

const {
  SzEnvironment,
  SzEngineNative,
  SzConfigManagerNative,
  SzDiagnosticNative,
  SzProductNative,
  SzEnvironmentNative,
} = sdk;

function getTestConfig() {
  const senzingBase = process.platform === 'darwin'
    ? '/opt/homebrew/opt/senzing/runtime/er'
    : '/opt/senzing/er';
  const supportPath = process.platform === 'darwin'
    ? '/opt/homebrew/opt/senzing/runtime/data'
    : '/opt/senzing/data';
  const dbPath = '/tmp/sz-adapter-test.db';
  return {
    settings: JSON.stringify({
      PIPELINE: {
        CONFIGPATH: path.join(senzingBase, 'resources/templates'),
        RESOURCEPATH: path.join(senzingBase, 'resources'),
        SUPPORTPATH: supportPath,
      },
      SQL: { CONNECTION: `sqlite3://na:na@${dbPath}` },
    }),
    dbPath,
    schemaPath: path.join(senzingBase, 'resources/schema/szcore-schema-sqlite-create.sql'),
  };
}

const config = getTestConfig();

// Check if runtime is available
const canRun = fs.existsSync(config.schemaPath);
const describeIfRuntime = canRun ? describe : describe.skip;

describeIfRuntime('Native SDK adapters', () => {
  let env: any;
  let engine: any;
  let configManager: any;
  let diagnostic: any;
  let product: any;
  let environment: any;

  beforeAll(() => {
    if (fs.existsSync(config.dbPath)) fs.unlinkSync(config.dbPath);
    execSync(`sqlite3 ${config.dbPath} < ${config.schemaPath}`);

    env = new SzEnvironment('adapter-test', config.settings, false);

    // Bootstrap data sources
    const rawCm = env.getConfigManager();
    let configJson = rawCm.createConfig();
    configJson = configtool.addDataSource(configJson, { code: 'TEST_DS' });
    const configId = rawCm.setDefaultConfig(configJson, 'adapter test config');
    env.reinitialize(configId);

    // Create adapters
    engine = new SzEngineNative(env.getEngine());
    configManager = new SzConfigManagerNative(env.getConfigManager());
    diagnostic = new SzDiagnosticNative(env.getDiagnostic());
    product = new SzProductNative(env.getProduct());
    environment = new SzEnvironmentNative(env);
  });

  afterAll(() => {
    if (env && !env.isDestroyed()) env.destroy();
    if (fs.existsSync(config.dbPath)) fs.unlinkSync(config.dbPath);
  });

  // -- SzProductNative --------------------------------------------------------

  test('product.getVersion returns parsed object', async () => {
    const version = await product.getVersion();
    expect(typeof version).toBe('object');
    expect(version).toHaveProperty('VERSION');
    expect(version).toHaveProperty('BUILD_DATE');
  });

  test('product.getLicense returns parsed object', async () => {
    const license = await product.getLicense();
    expect(typeof license).toBe('object');
    expect(license).toHaveProperty('licenseType');
  });

  // -- SzConfigManagerNative --------------------------------------------------

  test('configManager.createConfig returns parsed object', async () => {
    const config = await configManager.createConfig();
    expect(typeof config).toBe('object');
    expect(config).toHaveProperty('G2_CONFIG');
  });

  test('configManager.getDefaultConfigId returns number', async () => {
    const id = await configManager.getDefaultConfigId();
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  test('configManager.getConfigRegistry returns parsed object', async () => {
    const registry = await configManager.getConfigRegistry();
    expect(typeof registry).toBe('object');
    expect(registry).toHaveProperty('CONFIGS');
  });

  // -- SzDiagnosticNative -----------------------------------------------------

  test('diagnostic.getRepositoryInfo returns parsed object', async () => {
    const info = await diagnostic.getRepositoryInfo();
    expect(typeof info).toBe('object');
    expect(info).toHaveProperty('dataStores');
  });

  // -- SzEnvironmentNative ----------------------------------------------------

  test('environment.isDestroyed returns boolean', async () => {
    const destroyed = await environment.isDestroyed();
    expect(typeof destroyed).toBe('boolean');
    expect(destroyed).toBe(false);
  });

  test('environment.getActiveConfigId returns number', async () => {
    const id = await environment.getActiveConfigId();
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  // -- SzEngineNative ---------------------------------------------------------

  test('engine.addRecord returns parsed object with WITH_INFO', async () => {
    const WITH_INFO = 1n << 62n;
    const result = await engine.addRecord(
      'TEST_DS', 'ADAPT-1',
      JSON.stringify({ NAME_FULL: 'Adapter Test', DATE_OF_BIRTH: '1990-01-01' }),
      WITH_INFO,
    );
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('AFFECTED_ENTITIES');
  });

  test('engine.getRecord returns parsed object', async () => {
    const record = await engine.getRecord('TEST_DS', 'ADAPT-1');
    expect(typeof record).toBe('object');
    expect(record).toHaveProperty('DATA_SOURCE', 'TEST_DS');
    expect(record).toHaveProperty('RECORD_ID', 'ADAPT-1');
  });

  test('engine.getEntityByRecord returns parsed object', async () => {
    const entity = await engine.getEntityByRecord('TEST_DS', 'ADAPT-1');
    expect(typeof entity).toBe('object');
    expect(entity).toHaveProperty('RESOLVED_ENTITY');
    expect(entity.RESOLVED_ENTITY).toHaveProperty('ENTITY_ID');
  });

  test('engine.getEntityById returns parsed object', async () => {
    const entity = await engine.getEntityByRecord('TEST_DS', 'ADAPT-1');
    const entityId = entity.RESOLVED_ENTITY.ENTITY_ID;
    const byId = await engine.getEntityById(entityId);
    expect(byId).toHaveProperty('RESOLVED_ENTITY');
  });

  test('engine.getStats returns parsed object', async () => {
    const stats = await engine.getStats();
    expect(typeof stats).toBe('object');
    expect(stats).toHaveProperty('workload');
  });

  test('engine.countRedoRecords returns number', async () => {
    const count = await engine.countRedoRecords();
    expect(typeof count).toBe('number');
  });

  test('engine.primeEngine resolves to undefined', async () => {
    const result = await engine.primeEngine();
    expect(result).toBeUndefined();
  });

  test('engine.deleteRecord returns parsed object with WITH_INFO', async () => {
    const WITH_INFO = 1n << 62n;
    const result = await engine.deleteRecord('TEST_DS', 'ADAPT-1', WITH_INFO);
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('AFFECTED_ENTITIES');
  });

  // -- All adapters return Promises -------------------------------------------

  test('all adapter methods return Promises', () => {
    // Verify methods return Promises (thenable)
    expect(product.getVersion()).toBeInstanceOf(Promise);
    expect(configManager.getDefaultConfigId()).toBeInstanceOf(Promise);
    expect(diagnostic.getRepositoryInfo()).toBeInstanceOf(Promise);
    expect(environment.isDestroyed()).toBeInstanceOf(Promise);
    expect(engine.getStats()).toBeInstanceOf(Promise);
  });
});
