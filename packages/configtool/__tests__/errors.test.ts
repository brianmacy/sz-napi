import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const configtool = require('../configtool.js');
const { SzConfigError } = configtool;

const fixtureConfig = readFileSync(
  join(__dirname, 'fixtures', 'test-config.json'),
  'utf-8'
);

describe('errors', () => {
  test('SzConfigError has correct name property', () => {
    expect.assertions(2);
    try {
      configtool.deleteDataSource(fixtureConfig, 'NONEXISTENT');
    } catch (err: any) {
      expect(err).toBeInstanceOf(SzConfigError);
      expect(err.name).toBe('SzConfigError');
    }
  });

  test('SzConfigError has correct errorType for NotFound', () => {
    expect.assertions(2);
    try {
      configtool.getDataSource(fixtureConfig, 'NONEXISTENT');
    } catch (err: any) {
      expect(err.errorType).toBe('NotFound');
      expect(err.message).toBeTruthy();
    }
  });

  test('SzConfigError has correct errorType for AlreadyExists', () => {
    expect.assertions(2);
    try {
      configtool.addDataSource(fixtureConfig, { code: 'SYSTEM' });
    } catch (err: any) {
      expect(err.errorType).toBe('AlreadyExists');
      expect(err.message).toBeTruthy();
    }
  });

  test('SzConfigError from invalid JSON has errorType JsonParse', () => {
    expect.assertions(2);
    try {
      configtool.listDataSources('not valid json');
    } catch (err: any) {
      expect(err).toBeInstanceOf(SzConfigError);
      expect(err.errorType).toBe('JsonParse');
    }
  });

  test('SzConfigError from empty string has errorType JsonParse', () => {
    expect.assertions(2);
    try {
      configtool.listDataSources('');
    } catch (err: any) {
      expect(err).toBeInstanceOf(SzConfigError);
      expect(err.errorType).toBe('JsonParse');
    }
  });

  test('SzConfigError from missing section has errorType MissingSection', () => {
    expect.assertions(2);
    const noSections = JSON.stringify({ G2_CONFIG: {} });
    try {
      configtool.listDataSources(noSections);
    } catch (err: any) {
      expect(err).toBeInstanceOf(SzConfigError);
      expect(err.errorType).toBe('MissingSection');
    }
  });

  test('SzConfigError has meaningful message without error code prefix', () => {
    expect.assertions(2);
    try {
      configtool.getDataSource(fixtureConfig, 'NONEXISTENT');
    } catch (err: any) {
      // The JS wrapper strips the [ErrorType] prefix
      expect(err.message).not.toMatch(/^\[/);
      expect(err.message.length).toBeGreaterThan(0);
    }
  });

  test('SzConfigError from InvalidInput for system datasource deletion', () => {
    expect.assertions(2);
    try {
      configtool.deleteDataSource(fixtureConfig, 'SYSTEM');
    } catch (err: any) {
      expect(err).toBeInstanceOf(SzConfigError);
      expect(err.errorType).toBe('InvalidInput');
    }
  });

  test('multiple error types are distinct', () => {
    const errors: string[] = [];

    try { configtool.getDataSource(fixtureConfig, 'X'); } catch (e: any) { errors.push(e.errorType); }
    try { configtool.addDataSource(fixtureConfig, { code: 'SYSTEM' }); } catch (e: any) { errors.push(e.errorType); }
    try { configtool.listDataSources('bad'); } catch (e: any) { errors.push(e.errorType); }
    try { configtool.deleteDataSource(fixtureConfig, 'SYSTEM'); } catch (e: any) { errors.push(e.errorType); }

    expect(errors).toEqual(['NotFound', 'AlreadyExists', 'JsonParse', 'InvalidInput']);
  });
});
