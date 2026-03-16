import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const configtool = require('../configtool.js');

const richConfig = readFileSync(
  join(__dirname, 'fixtures', 'rich-config.json'),
  'utf-8'
);

describe('versioning', () => {
  test('getVersion returns a version string', () => {
    const version = configtool.getVersion(richConfig);
    expect(typeof version).toBe('string');
    expect(version).toBe('4.0.0');
  });

  test('getCompatibilityVersion returns a version string', () => {
    const version = configtool.getCompatibilityVersion(richConfig);
    expect(typeof version).toBe('string');
    expect(version).toBe('11');
  });

  test('updateCompatibilityVersion changes the version', () => {
    const modified = configtool.updateCompatibilityVersion(richConfig, '12');
    const version = configtool.getCompatibilityVersion(modified);
    expect(version).toBe('12');
  });

  test('updateCompatibilityVersion does not affect original config', () => {
    configtool.updateCompatibilityVersion(richConfig, '99');
    const version = configtool.getCompatibilityVersion(richConfig);
    expect(version).toBe('11');
  });

  test('verifyCompatibilityVersion returns match when correct', () => {
    const result = configtool.verifyCompatibilityVersion(richConfig, '11');
    expect(result.currentVersion).toBe('11');
    expect(result.matches).toBe(true);
  });

  test('verifyCompatibilityVersion returns no match when incorrect', () => {
    const result = configtool.verifyCompatibilityVersion(richConfig, '99');
    expect(result.currentVersion).toBe('11');
    expect(result.matches).toBe(false);
  });

  test('getVersion on config without version throws NotFound', () => {
    const minimalConfig = JSON.stringify({ G2_CONFIG: {} });
    const { SzConfigError } = configtool;
    expect(() => {
      configtool.getVersion(minimalConfig);
    }).toThrow(SzConfigError);

    try {
      configtool.getVersion(minimalConfig);
    } catch (err: any) {
      expect(err.errorType).toBe('NotFound');
    }
  });

  test('getCompatibilityVersion on config without version throws NotFound', () => {
    const minimalConfig = JSON.stringify({ G2_CONFIG: {} });
    const { SzConfigError } = configtool;
    expect(() => {
      configtool.getCompatibilityVersion(minimalConfig);
    }).toThrow(SzConfigError);

    try {
      configtool.getCompatibilityVersion(minimalConfig);
    } catch (err: any) {
      expect(err.errorType).toBe('NotFound');
    }
  });

  test('bridgeVersion returns a string', () => {
    const version = configtool.bridgeVersion();
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });
});
