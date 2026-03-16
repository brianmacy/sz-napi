import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const configtool = require('../configtool.js');

const richConfig = readFileSync(
  join(__dirname, 'fixtures', 'rich-config.json'),
  'utf-8'
);

describe('attributes', () => {
  test('listAttributes returns array from rich fixture', () => {
    const result = JSON.parse(configtool.listAttributes(richConfig));
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
  });

  test('listAttributes returns objects with expected fields', () => {
    const result = JSON.parse(configtool.listAttributes(richConfig));
    const first = result[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('attribute');
    expect(first).toHaveProperty('class');
    expect(first).toHaveProperty('feature');
    expect(first).toHaveProperty('element');
    expect(first).toHaveProperty('required');
    expect(first).toHaveProperty('internal');
  });

  test('listAttributes contains expected attributes', () => {
    const result = JSON.parse(configtool.listAttributes(richConfig));
    const names = result.map((a: { attribute: string }) => a.attribute);
    expect(names).toContain('NAME_FULL');
    expect(names).toContain('ADDR_FULL');
    expect(names).toContain('PHONE_NUMBER');
  });

  test('getAttribute returns the correct attribute', () => {
    const attr = JSON.parse(configtool.getAttribute(richConfig, 'NAME_FULL'));
    expect(attr.ATTR_CODE).toBe('NAME_FULL');
    expect(attr.ATTR_CLASS).toBe('NAME');
    expect(attr.FTYPE_CODE).toBe('NAME');
    expect(attr.FELEM_CODE).toBe('FULL_NAME');
  });

  test('getAttribute is case-insensitive', () => {
    const attr = JSON.parse(configtool.getAttribute(richConfig, 'name_full'));
    expect(attr.ATTR_CODE).toBe('NAME_FULL');
  });

  test('addAttribute with valid params adds attribute', () => {
    const modified = configtool.addAttribute(richConfig, {
      attribute: 'DOB_FULL',
      feature: 'DOB',
      element: 'DOB_FULL',
      class: 'ATTRIBUTE',
    });
    const result = JSON.parse(configtool.listAttributes(modified));
    expect(result.length).toBe(4);
    const names = result.map((a: { attribute: string }) => a.attribute);
    expect(names).toContain('DOB_FULL');
  });

  test('addAttribute assigns next sequential ID', () => {
    const modified = configtool.addAttribute(richConfig, {
      attribute: 'DOB_FULL',
      feature: 'DOB',
      element: 'DOB_FULL',
      class: 'ATTRIBUTE',
    });
    const attr = JSON.parse(configtool.getAttribute(modified, 'DOB_FULL'));
    expect(attr.ATTR_ID).toBe(1004);
  });

  test('addAttribute with optional params', () => {
    const modified = configtool.addAttribute(richConfig, {
      attribute: 'DOB_FULL',
      feature: 'DOB',
      element: 'DOB_FULL',
      class: 'ATTRIBUTE',
      internal: 'Yes',
      required: 'Desired',
      defaultValue: 'N/A',
    });
    const attr = JSON.parse(configtool.getAttribute(modified, 'DOB_FULL'));
    expect(attr.INTERNAL).toBe('Yes');
    expect(attr.FELEM_REQ).toBe('Desired');
    expect(attr.DEFAULT_VALUE).toBe('N/A');
  });

  test('deleteAttribute removes an attribute', () => {
    const modified = configtool.addAttribute(richConfig, {
      attribute: 'TEMP_ATTR',
      feature: 'NAME',
      element: 'FULL_NAME',
      class: 'NAME',
    });
    const beforeDelete = JSON.parse(configtool.listAttributes(modified));
    expect(beforeDelete.length).toBe(4);

    const afterDelete = configtool.deleteAttribute(modified, 'TEMP_ATTR');
    const result = JSON.parse(configtool.listAttributes(afterDelete));
    expect(result.length).toBe(3);
    const names = result.map((a: { attribute: string }) => a.attribute);
    expect(names).not.toContain('TEMP_ATTR');
  });

  test('setAttribute modifies properties', () => {
    const updated = configtool.setAttribute(richConfig, {
      attribute: 'NAME_FULL',
      internal: 'Yes',
      required: 'Desired',
      defaultValue: 'Unknown',
    });
    const attr = JSON.parse(configtool.getAttribute(updated, 'NAME_FULL'));
    expect(attr.INTERNAL).toBe('Yes');
    expect(attr.FELEM_REQ).toBe('Desired');
    expect(attr.DEFAULT_VALUE).toBe('Unknown');
  });

  test('addAttribute with duplicate code throws AlreadyExists', () => {
    const { SzConfigError } = configtool;
    expect(() => {
      configtool.addAttribute(richConfig, {
        attribute: 'NAME_FULL',
        feature: 'NAME',
        element: 'FULL_NAME',
        class: 'NAME',
      });
    }).toThrow(SzConfigError);

    try {
      configtool.addAttribute(richConfig, {
        attribute: 'NAME_FULL',
        feature: 'NAME',
        element: 'FULL_NAME',
        class: 'NAME',
      });
    } catch (err: any) {
      expect(err.errorType).toBe('AlreadyExists');
    }
  });

  test('getAttribute with non-existent code throws NotFound', () => {
    const { SzConfigError } = configtool;
    expect(() => {
      configtool.getAttribute(richConfig, 'NONEXISTENT');
    }).toThrow(SzConfigError);

    try {
      configtool.getAttribute(richConfig, 'NONEXISTENT');
    } catch (err: any) {
      expect(err.errorType).toBe('NotFound');
    }
  });

  test('deleteAttribute with non-existent code throws NotFound', () => {
    const { SzConfigError } = configtool;
    expect(() => {
      configtool.deleteAttribute(richConfig, 'NONEXISTENT');
    }).toThrow(SzConfigError);

    try {
      configtool.deleteAttribute(richConfig, 'NONEXISTENT');
    } catch (err: any) {
      expect(err.errorType).toBe('NotFound');
    }
  });

  test('addAttribute with invalid class throws InvalidInput', () => {
    const { SzConfigError } = configtool;
    expect(() => {
      configtool.addAttribute(richConfig, {
        attribute: 'BAD_CLASS_ATTR',
        feature: 'NAME',
        element: 'FULL_NAME',
        class: 'BOGUS',
      });
    }).toThrow(SzConfigError);

    try {
      configtool.addAttribute(richConfig, {
        attribute: 'BAD_CLASS_ATTR',
        feature: 'NAME',
        element: 'FULL_NAME',
        class: 'BOGUS',
      });
    } catch (err: any) {
      expect(err.errorType).toBe('InvalidInput');
    }
  });
});
