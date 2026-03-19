/**
 * Integration tests for @senzing/trpc
 *
 * Requires the Senzing runtime to be installed. Tests are skipped
 * if the runtime is not available.
 */
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

// Try to import the SDK — skip tests if unavailable
let sdk: any;
let configtool: any;
try {
  sdk = require('@senzing/sdk');
  configtool = require('@senzing/configtool');
} catch {
  // SDK not available
}

const canRun = (() => {
  if (!sdk) return false;
  try {
    // Check if Senzing runtime is available
    const senzingBase = process.platform === 'darwin'
      ? '/opt/homebrew/opt/senzing/runtime/er'
      : '/opt/senzing/er';
    return fs.existsSync(path.join(senzingBase, 'resources/templates'));
  } catch {
    return false;
  }
})();

const describeIfRuntime = canRun ? describe : describe.skip;

function getTestConfig() {
  const senzingBase = process.platform === 'darwin'
    ? '/opt/homebrew/opt/senzing/runtime/er'
    : '/opt/senzing/er';
  const supportPath = process.platform === 'darwin'
    ? '/opt/homebrew/opt/senzing/runtime/data'
    : '/opt/senzing/data';
  const dbPath = '/tmp/sz-trpc-integration-test.db';
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

describeIfRuntime('tRPC integration tests', () => {
  let env: any;
  let szTrpc: any;
  let caller: any;
  const config = getTestConfig();

  beforeAll(async () => {
    const { SzTrpcEnvironment } = await import('../src/context.js');
    const { szRouter } = await import('../src/router.js');
    const { t } = await import('../src/trpc.js');

    // Initialize SQLite database
    if (fs.existsSync(config.dbPath)) fs.unlinkSync(config.dbPath);
    execSync(`sqlite3 ${config.dbPath} < ${config.schemaPath}`);

    // Create environment
    env = new sdk.SzEnvironment('trpc-test', config.settings, false);

    // Bootstrap data sources
    const configManager = env.getConfigManager();
    let configJson = configManager.createConfig();
    configJson = configtool.addDataSource(configJson, { code: 'TEST_DS' });
    const configId = configManager.setDefaultConfig(configJson, 'integration test config');
    env.reinitialize(configId);

    // Create tRPC context
    szTrpc = new SzTrpcEnvironment({ environment: env });

    // Create a caller factory for direct procedure calls (no HTTP needed)
    const createCallerFactory = t.createCallerFactory(szRouter);
    caller = createCallerFactory(() => szTrpc.context);
  });

  afterAll(() => {
    if (env && !env.isDestroyed()) {
      env.destroy();
    }
    if (fs.existsSync(config.dbPath)) {
      fs.unlinkSync(config.dbPath);
    }
  });

  test('product.getVersion returns version info', async () => {
    const version = await caller.product.getVersion();
    expect(version).toHaveProperty('VERSION');
    expect(version).toHaveProperty('BUILD_DATE');
  });

  test('product.getLicense returns license info', async () => {
    const license = await caller.product.getLicense();
    expect(license).toHaveProperty('licenseType');
  });

  test('record lifecycle: add → get → getEntity → delete', async () => {
    // Add record
    const addResult = await caller.engine.addRecord({
      dataSourceCode: 'TEST_DS',
      recordId: 'INTEG-1',
      recordDefinition: JSON.stringify({
        NAME_FULL: 'Integration Test Person',
        DATE_OF_BIRTH: '1990-01-15',
      }),
      flags: 1n << 62n, // WITH_INFO
    });
    expect(addResult).toHaveProperty('AFFECTED_ENTITIES');

    // Get record
    const record = await caller.engine.getRecord({
      dataSourceCode: 'TEST_DS',
      recordId: 'INTEG-1',
    });
    expect(record).toHaveProperty('DATA_SOURCE', 'TEST_DS');
    expect(record).toHaveProperty('RECORD_ID', 'INTEG-1');

    // Get entity by record
    const entity = await caller.engine.getEntityByRecord({
      dataSourceCode: 'TEST_DS',
      recordId: 'INTEG-1',
    });
    expect(entity).toHaveProperty('RESOLVED_ENTITY');
    expect(entity.RESOLVED_ENTITY).toHaveProperty('ENTITY_ID');

    // Delete record
    const deleteResult = await caller.engine.deleteRecord({
      dataSourceCode: 'TEST_DS',
      recordId: 'INTEG-1',
      flags: 1n << 62n,
    });
    expect(deleteResult).toHaveProperty('AFFECTED_ENTITIES');
  });

  test('configManager.getDefaultConfigId returns a number', async () => {
    const configId = await caller.configManager.getDefaultConfigId();
    expect(typeof configId).toBe('number');
    expect(configId).toBeGreaterThan(0);
  });

  test('configManager.createConfig returns config JSON', async () => {
    const config = await caller.configManager.createConfig();
    expect(config).toHaveProperty('G2_CONFIG');
  });

  test('configManager.getConfigRegistry returns registry', async () => {
    const registry = await caller.configManager.getConfigRegistry();
    expect(registry).toHaveProperty('CONFIGS');
    expect(Array.isArray(registry.CONFIGS)).toBe(true);
  });

  test('diagnostic.getRepositoryInfo returns info', async () => {
    const info = await caller.diagnostic.getRepositoryInfo();
    expect(info).toHaveProperty('dataStores');
  });

  test('environment.getActiveConfigId returns a number', async () => {
    const configId = await caller.environment.getActiveConfigId();
    expect(typeof configId).toBe('number');
  });

  test('environment.isDestroyed returns false while running', async () => {
    const destroyed = await caller.environment.isDestroyed();
    expect(destroyed).toBe(false);
  });

  test('engine.getStats returns stats', async () => {
    const stats = await caller.engine.getStats();
    expect(stats).toHaveProperty('workload');
  });

  test('error: bad data source throws BAD_REQUEST', async () => {
    const { TRPCError } = await import('@trpc/server');
    await expect(
      caller.engine.addRecord({
        dataSourceCode: 'NONEXISTENT_DS',
        recordId: '1',
        recordDefinition: '{"NAME_FULL":"Test"}',
      }),
    ).rejects.toThrow(TRPCError);

    try {
      await caller.engine.addRecord({
        dataSourceCode: 'NONEXISTENT_DS',
        recordId: '1',
        recordDefinition: '{"NAME_FULL":"Test"}',
      });
    } catch (err: any) {
      expect(err.code).toBe('BAD_REQUEST');
    }
  });
});
