import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const configtool = require('../configtool.js');

const fixtureConfig = readFileSync(
  join(__dirname, 'fixtures', 'test-config.json'),
  'utf-8'
);

describe('datasources', () => {
  test('listDataSources returns array from fixture', () => {
    const result = JSON.parse(configtool.listDataSources(fixtureConfig));
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('dataSource');
  });

  test('listDataSources contains SYSTEM and SEARCH', () => {
    const result = JSON.parse(configtool.listDataSources(fixtureConfig));
    const codes = result.map((ds: { dataSource: string }) => ds.dataSource);
    expect(codes).toContain('SYSTEM');
    expect(codes).toContain('SEARCH');
  });

  test('addDataSource adds a new source and it appears in the returned config', () => {
    const modified = configtool.addDataSource(fixtureConfig, { code: 'CUSTOMERS' });
    const result = JSON.parse(configtool.listDataSources(modified));
    expect(result.length).toBe(3);
    const codes = result.map((ds: { dataSource: string }) => ds.dataSource);
    expect(codes).toContain('CUSTOMERS');
  });

  test('addDataSource uppercases the code', () => {
    const modified = configtool.addDataSource(fixtureConfig, { code: 'lowercase_src' });
    const result = JSON.parse(configtool.listDataSources(modified));
    const codes = result.map((ds: { dataSource: string }) => ds.dataSource);
    expect(codes).toContain('LOWERCASE_SRC');
  });

  test('addDataSource assigns next sequential ID', () => {
    const modified = configtool.addDataSource(fixtureConfig, { code: 'NEW_SRC' });
    const result = JSON.parse(configtool.listDataSources(modified));
    const newSrc = result.find((ds: { dataSource: string }) => ds.dataSource === 'NEW_SRC');
    expect(newSrc.id).toBe(3);
  });

  test('addDataSource with optional parameters', () => {
    const modified = configtool.addDataSource(fixtureConfig, {
      code: 'CUSTOM',
      retentionLevel: 'Forget',
      conversational: 'Yes',
      reliability: 5,
    });
    const dsrc = JSON.parse(configtool.getDataSource(modified, 'CUSTOM'));
    expect(dsrc.RETENTION_LEVEL).toBe('Forget');
    expect(dsrc.CONVERSATIONAL).toBe('Yes');
    expect(dsrc.DSRC_RELY).toBe(5);
  });

  test('getDataSource returns the correct source', () => {
    const modified = configtool.addDataSource(fixtureConfig, { code: 'TESTGET' });
    const dsrc = JSON.parse(configtool.getDataSource(modified, 'TESTGET'));
    expect(dsrc.DSRC_CODE).toBe('TESTGET');
    expect(dsrc.DSRC_ID).toBe(3);
    expect(dsrc.RETENTION_LEVEL).toBe('Remember');
    expect(dsrc.CONVERSATIONAL).toBe('No');
  });

  test('getDataSource is case-insensitive', () => {
    const modified = configtool.addDataSource(fixtureConfig, { code: 'CASETEST' });
    const dsrc = JSON.parse(configtool.getDataSource(modified, 'casetest'));
    expect(dsrc.DSRC_CODE).toBe('CASETEST');
  });

  test('setDataSource modifies properties', () => {
    const modified = configtool.addDataSource(fixtureConfig, { code: 'MODIFIABLE' });
    const updated = configtool.setDataSource(modified, 'MODIFIABLE', {
      retentionLevel: 'Forget',
      conversational: 'Yes',
      reliability: 10,
    });
    const dsrc = JSON.parse(configtool.getDataSource(updated, 'MODIFIABLE'));
    expect(dsrc.RETENTION_LEVEL).toBe('Forget');
    expect(dsrc.CONVERSATIONAL).toBe('Yes');
    expect(dsrc.DSRC_RELY).toBe(10);
  });

  test('deleteDataSource removes a user-created source', () => {
    const modified = configtool.addDataSource(fixtureConfig, { code: 'DELETEME' });
    const beforeDelete = JSON.parse(configtool.listDataSources(modified));
    expect(beforeDelete.length).toBe(3);

    const afterDelete = configtool.deleteDataSource(modified, 'DELETEME');
    const result = JSON.parse(configtool.listDataSources(afterDelete));
    expect(result.length).toBe(2);
    const codes = result.map((ds: { dataSource: string }) => ds.dataSource);
    expect(codes).not.toContain('DELETEME');
  });

  test('addDataSource with duplicate code throws SzConfigError with AlreadyExists', () => {
    const { SzConfigError } = configtool;
    expect(() => {
      configtool.addDataSource(fixtureConfig, { code: 'SYSTEM' });
    }).toThrow(SzConfigError);

    try {
      configtool.addDataSource(fixtureConfig, { code: 'SYSTEM' });
    } catch (err: any) {
      expect(err.name).toBe('SzConfigError');
      expect(err.errorType).toBe('AlreadyExists');
    }
  });

  test('deleteDataSource with non-existent code throws SzConfigError with NotFound', () => {
    const { SzConfigError } = configtool;
    expect(() => {
      configtool.deleteDataSource(fixtureConfig, 'NONEXISTENT');
    }).toThrow(SzConfigError);

    try {
      configtool.deleteDataSource(fixtureConfig, 'NONEXISTENT');
    } catch (err: any) {
      expect(err.name).toBe('SzConfigError');
      expect(err.errorType).toBe('NotFound');
    }
  });

  test('deleteDataSource on system datasource throws SzConfigError with InvalidInput', () => {
    const { SzConfigError } = configtool;
    expect(() => {
      configtool.deleteDataSource(fixtureConfig, 'SYSTEM');
    }).toThrow(SzConfigError);

    try {
      configtool.deleteDataSource(fixtureConfig, 'SYSTEM');
    } catch (err: any) {
      expect(err.name).toBe('SzConfigError');
      expect(err.errorType).toBe('InvalidInput');
    }
  });

  test('operations do not share state between calls', () => {
    configtool.addDataSource(fixtureConfig, { code: 'EPHEMERAL' });
    // The original fixture should still only have 2 sources
    const result = JSON.parse(configtool.listDataSources(fixtureConfig));
    expect(result.length).toBe(2);
  });
});
