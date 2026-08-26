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
    ? '/opt/homebrew/opt/senzing/er' : '/opt/senzing/er';
  const supportPath = process.platform === 'darwin'
    ? '/opt/homebrew/opt/senzing/data' : '/opt/senzing/data';
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

  test('product.getVersion returns JSON string', async () => {
    const version = await product.getVersion();
    expect(typeof version).toBe('string');
    const parsed = JSON.parse(version);
    expect(parsed).toHaveProperty('VERSION');
    expect(parsed).toHaveProperty('BUILD_DATE');
  });

  test('product.getLicense returns JSON string', async () => {
    const license = await product.getLicense();
    expect(typeof license).toBe('string');
    expect(JSON.parse(license)).toHaveProperty('licenseType');
  });

  // -- SzConfigManagerNative --------------------------------------------------

  test('configManager.createConfig returns JSON string', async () => {
    const config = await configManager.createConfig();
    expect(typeof config).toBe('string');
    expect(JSON.parse(config)).toHaveProperty('G2_CONFIG');
  });

  test('configManager.getDefaultConfigId returns number', async () => {
    const id = await configManager.getDefaultConfigId();
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  test('configManager.getConfigRegistry returns JSON string', async () => {
    const registry = await configManager.getConfigRegistry();
    expect(typeof registry).toBe('string');
    expect(JSON.parse(registry)).toHaveProperty('CONFIGS');
  });

  // -- SzDiagnosticNative -----------------------------------------------------

  test('diagnostic.getRepositoryInfo returns JSON string', async () => {
    const info = await diagnostic.getRepositoryInfo();
    expect(typeof info).toBe('string');
    expect(JSON.parse(info)).toHaveProperty('dataStores');
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

  test('engine.addRecord returns JSON string with WITH_INFO', async () => {
    const WITH_INFO = 1n << 62n;
    const result = await engine.addRecord(
      'TEST_DS', 'ADAPT-1',
      JSON.stringify({ NAME_FULL: 'Adapter Test', DATE_OF_BIRTH: '1990-01-01' }),
      WITH_INFO,
    );
    expect(typeof result).toBe('string');
    expect(JSON.parse(result)).toHaveProperty('AFFECTED_ENTITIES');
  });

  test('engine.getRecord returns JSON string', async () => {
    const record = await engine.getRecord('TEST_DS', 'ADAPT-1');
    expect(typeof record).toBe('string');
    const parsed = JSON.parse(record);
    expect(parsed).toHaveProperty('DATA_SOURCE', 'TEST_DS');
    expect(parsed).toHaveProperty('RECORD_ID', 'ADAPT-1');
  });

  test('engine.getEntityByRecord returns JSON string', async () => {
    const entity = await engine.getEntityByRecord('TEST_DS', 'ADAPT-1');
    expect(typeof entity).toBe('string');
    const parsed = JSON.parse(entity);
    expect(parsed).toHaveProperty('RESOLVED_ENTITY');
    expect(parsed.RESOLVED_ENTITY).toHaveProperty('ENTITY_ID');
  });

  test('engine.getEntityById returns JSON string', async () => {
    const entity = JSON.parse(await engine.getEntityByRecord('TEST_DS', 'ADAPT-1'));
    const entityId = entity.RESOLVED_ENTITY.ENTITY_ID;
    const byId = await engine.getEntityById(entityId);
    expect(typeof byId).toBe('string');
    expect(JSON.parse(byId)).toHaveProperty('RESOLVED_ENTITY');
  });

  test('engine.getStats returns JSON string', async () => {
    const stats = await engine.getStats();
    expect(typeof stats).toBe('string');
    expect(JSON.parse(stats)).toHaveProperty('workload');
  });

  test('engine.countRedoRecords returns number', async () => {
    const count = await engine.countRedoRecords();
    expect(typeof count).toBe('number');
  });

  test('engine.primeEngine resolves to undefined', async () => {
    const result = await engine.primeEngine();
    expect(result).toBeUndefined();
  });

  test('engine.deleteRecord returns JSON string with WITH_INFO', async () => {
    const WITH_INFO = 1n << 62n;
    const result = await engine.deleteRecord('TEST_DS', 'ADAPT-1', WITH_INFO);
    expect(typeof result).toBe('string');
    expect(JSON.parse(result)).toHaveProperty('AFFECTED_ENTITIES');
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
