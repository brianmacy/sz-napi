import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const configtool = require('../configtool.js');

const fixtureConfig = readFileSync(
  join(__dirname, 'fixtures', 'test-config.json'),
  'utf-8'
);

const richConfig = readFileSync(
  join(__dirname, 'fixtures', 'rich-config.json'),
  'utf-8'
);

describe('config sections', () => {
  test('listConfigSections returns array of section names', () => {
    const result = JSON.parse(configtool.listConfigSections(fixtureConfig));
    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain('CFG_DSRC');
    expect(result).toContain('CFG_ATTR');
    expect(result).toContain('CFG_FTYPE');
    expect(result).toContain('CFG_FELEM');
  });

  test('listConfigSections on rich config returns many sections', () => {
    const result = JSON.parse(configtool.listConfigSections(richConfig));
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(4);
    expect(result).toContain('CONFIG_BASE_VERSION');
    expect(result).toContain('CFG_GPLAN');
  });

  test('addConfigSection adds a new section', () => {
    const modified = configtool.addConfigSection(fixtureConfig, 'CFG_CUSTOM');
    const sections = JSON.parse(configtool.listConfigSections(modified));
    expect(sections).toContain('CFG_CUSTOM');
  });

  test('addConfigSection uppercases the section name', () => {
    const modified = configtool.addConfigSection(fixtureConfig, 'cfg_lower');
    const sections = JSON.parse(configtool.listConfigSections(modified));
    expect(sections).toContain('CFG_LOWER');
  });

  test('removeConfigSection removes a section', () => {
    const modified = configtool.addConfigSection(fixtureConfig, 'CFG_REMOVABLE');
    const before = JSON.parse(configtool.listConfigSections(modified));
    expect(before).toContain('CFG_REMOVABLE');

    const afterRemove = configtool.removeConfigSection(modified, 'CFG_REMOVABLE');
    const after = JSON.parse(configtool.listConfigSections(afterRemove));
    expect(after).not.toContain('CFG_REMOVABLE');
  });

  test('addConfigSection with duplicate throws AlreadyExists', () => {
    const { SzConfigError } = configtool;
    expect(() => {
      configtool.addConfigSection(fixtureConfig, 'CFG_DSRC');
    }).toThrow(SzConfigError);

    try {
      configtool.addConfigSection(fixtureConfig, 'CFG_DSRC');
    } catch (err: any) {
      expect(err.errorType).toBe('AlreadyExists');
    }
  });

  test('removeConfigSection with non-existent section throws NotFound', () => {
    const { SzConfigError } = configtool;
    expect(() => {
      configtool.removeConfigSection(fixtureConfig, 'CFG_NONEXISTENT');
    }).toThrow(SzConfigError);

    try {
      configtool.removeConfigSection(fixtureConfig, 'CFG_NONEXISTENT');
    } catch (err: any) {
      expect(err.errorType).toBe('NotFound');
    }
  });

  test('getConfigSection returns items from a section', () => {
    const result = JSON.parse(configtool.getConfigSection(richConfig, 'CFG_DSRC'));
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  test('getConfigSection returns empty array for empty section', () => {
    const result = JSON.parse(configtool.getConfigSection(richConfig, 'CFG_GPLAN'));
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test('getConfigSection with non-existent section throws NotFound', () => {
    const { SzConfigError } = configtool;
    expect(() => {
      configtool.getConfigSection(richConfig, 'CFG_BOGUS');
    }).toThrow(SzConfigError);

    try {
      configtool.getConfigSection(richConfig, 'CFG_BOGUS');
    } catch (err: any) {
      expect(err.errorType).toBe('NotFound');
    }
  });

  test('addConfigSectionField adds a field to all items in a section', () => {
    const modified = configtool.addConfigSectionField(
      richConfig,
      'CFG_DSRC',
      'NEW_FIELD',
      '"default_value"'
    );
    const items = JSON.parse(configtool.getConfigSection(modified, 'CFG_DSRC'));
    for (const item of items) {
      expect(item.NEW_FIELD).toBe('default_value');
    }
  });

  test('removeConfigSectionField removes a field from all items', () => {
    const modified = configtool.removeConfigSectionField(
      richConfig,
      'CFG_DSRC',
      'CONVERSATIONAL'
    );
    const items = JSON.parse(configtool.getConfigSection(modified, 'CFG_DSRC'));
    for (const item of items) {
      expect(item).not.toHaveProperty('CONVERSATIONAL');
    }
  });
});
