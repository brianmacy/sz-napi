// Tests against the stock Senzing g2config.json template (sz_configtool_lib 0.10.0 port).
//
// Template location: $SZ_G2CONFIG_TEMPLATE, else $SZ_ROOT/opt/senzing/er/resources/templates/g2config.json,
// else /opt/senzing/er/resources/templates/g2config.json. A missing template fails the suite.
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const configtool = require('../configtool.js');

const templatePath =
  process.env.SZ_G2CONFIG_TEMPLATE ||
  join(process.env.SZ_ROOT || '/', 'opt/senzing/er/resources/templates/g2config.json');
const stock: string = readFileSync(templatePath, 'utf-8');

type Row = Record<string, unknown>;
const section = (cfg: string, name: string): Row[] => JSON.parse(cfg).G2_CONFIG[name];
const idOf = (cfg: string, sec: string, codeKey: string, idKey: string, code: string): number =>
  section(cfg, sec).find((r) => r[codeKey] === code)![idKey] as number;

function expectConfigError(fn: () => unknown, errorType: string) {
  let caught: { errorType?: string; failures?: unknown } | undefined;
  try {
    fn();
  } catch (e) {
    caught = e as { errorType?: string };
  }
  expect(caught, `expected an SzConfigError(${errorType})`).toBeDefined();
  expect(caught!.errorType).toBe(errorType);
  return caught!;
}

describe('search profiles (stock template)', () => {
  // 4.4.2+ templates ship INGEST and SEARCH; older ones have no CFG_SPROFILE section at all.
  const shippedRows: Row[] = [...(section(stock, 'CFG_SPROFILE') ?? [])].sort(
    (a, b) => (a.SPROFILE_ID as number) - (b.SPROFILE_ID as number),
  );
  const shipped = shippedRows.map((r) => r.SPROFILE_CODE as string);
  const maxShippedId = Math.max(0, ...shippedRows.map((r) => r.SPROFILE_ID as number));

  test('listSearchProfiles projects the shipped rows', () => {
    const listed = JSON.parse(configtool.listSearchProfiles(stock));
    expect(listed.map((p: Row) => [p.id, p.profile])).toEqual(shippedRows.map((r) => [r.SPROFILE_ID, r.SPROFILE_CODE]));
  });

  test('add / get / list / delete round trip', () => {
    const added = configtool.addSearchProfile(stock, {
      code: 'SEMKEY_SEARCH',
      plan: 'SEARCH',
      candidates: 'Off',
      description: 'Semantic key search',
      elements: [
        { feature: 'NAME', flag: 'Yes' },
        { feature: 'ADDRESS', flag: 'No' },
      ],
    });

    const raw = JSON.parse(configtool.getSearchProfile(added, 'semkey_search'));
    const nameId = idOf(stock, 'CFG_FTYPE', 'FTYPE_CODE', 'FTYPE_ID', 'NAME');
    const addrId = idOf(stock, 'CFG_FTYPE', 'FTYPE_CODE', 'FTYPE_ID', 'ADDRESS');
    const [lo, hi] = [
      [nameId, 'Y'],
      [addrId, 'N'],
    ].sort((a, b) => (a[0] as number) - (b[0] as number));
    expect(raw).toMatchObject({
      SPROFILE_CODE: 'SEMKEY_SEARCH',
      SPROFILE_DESC: 'Semantic key search',
      GPLAN_ID: idOf(stock, 'CFG_GPLAN', 'GPLAN_CODE', 'GPLAN_ID', 'SEARCH'),
      DEFAULT_USED_FOR_CAND: 'Off',
      FTYPE_OVERRIDES: `[{${lo[0]},${lo[1]}},{${hi[0]},${hi[1]}}]`,
    });
    expect(raw.SPROFILE_ID).toBeGreaterThan(maxShippedId);

    const listed = JSON.parse(configtool.listSearchProfiles(added));
    expect(listed.map((p: Row) => p.profile)).toEqual([...shipped, 'SEMKEY_SEARCH']);
    const mine = listed.find((p: Row) => p.profile === 'SEMKEY_SEARCH');
    expect(mine.genericPlan).toBe('SEARCH');
    expect(mine.candidates).toBe('Off');
    expect(mine.overridesRaw).toBe(raw.FTYPE_OVERRIDES);
    expect(mine.overrides).toHaveLength(2);

    const filtered = JSON.parse(configtool.listSearchProfiles(added, 'semkey'));
    expect(filtered.map((p: Row) => p.profile)).toEqual(['SEMKEY_SEARCH']);

    const deleted = configtool.deleteSearchProfile(added, 'SEMKEY_SEARCH');
    expect(JSON.parse(configtool.listSearchProfiles(deleted)).map((p: Row) => p.profile)).toEqual(shipped);
    expectConfigError(() => configtool.getSearchProfile(deleted, 'SEMKEY_SEARCH'), 'NotFound');
  });

  test('defaults: candidates Normal, no overrides', () => {
    const added = configtool.addSearchProfile(stock, { code: 'PLAIN', plan: 'INGEST' });
    const raw = JSON.parse(configtool.getSearchProfile(added, 'PLAIN'));
    expect(raw.DEFAULT_USED_FOR_CAND).toBe('Normal');
    expect(raw.FTYPE_OVERRIDES).toBe('[]');
  });

  test('errors map to the library error kinds', () => {
    const dup = configtool.addSearchProfile(stock, { code: 'DUP', plan: 'SEARCH' });
    expectConfigError(() => configtool.addSearchProfile(dup, { code: 'dup', plan: 'SEARCH' }), 'AlreadyExists');
    expectConfigError(() => configtool.addSearchProfile(stock, { code: 'X', plan: 'NO_SUCH_PLAN' }), 'NotFound');
    // INGEST / SEARCH are reserved: delete is refused even when present.
    const withIngest = shipped.includes('INGEST') ? stock : configtool.addSearchProfile(stock, { code: 'INGEST', plan: 'INGEST' });
    expectConfigError(() => configtool.deleteSearchProfile(withIngest, 'INGEST'), 'InvalidInput');
    expectConfigError(() => configtool.deleteSearchProfile(stock, 'NOPE'), 'NotFound');

    const err = expectConfigError(
      () =>
        configtool.addSearchProfile(stock, {
          code: 'BAD',
          plan: 'SEARCH',
          elements: [{ feature: 'NAME', flag: 'Maybe' }],
        }),
      'ValidationErrors',
    );
    expect(err.failures).toEqual([
      expect.objectContaining({ field: 'overrides', reasonCode: 'OUT_OF_DOMAIN' }),
    ]);
  });
});

describe('generic thresholds (stock template)', () => {
  const rows = (cfg: string) => section(cfg, 'CFG_GENERIC_THRESHOLD');

  test('setGenericThreshold updates the existing per-feature row in place', () => {
    const before = rows(stock);
    const gplan = idOf(stock, 'CFG_GPLAN', 'GPLAN_CODE', 'GPLAN_ID', 'INGEST');
    const ftype = idOf(stock, 'CFG_FTYPE', 'FTYPE_CODE', 'FTYPE_ID', 'ADDRESS');
    const isTarget = (r: Row) => r.GPLAN_ID === gplan && r.BEHAVIOR === 'FF' && r.FTYPE_ID === ftype;
    const targetIdx = before.findIndex(isTarget);
    expect(targetIdx).toBeGreaterThanOrEqual(0);
    expect(before[targetIdx].CANDIDATE_CAP).not.toBe(777);

    const updated = configtool.setGenericThreshold(stock, {
      plan: 'INGEST',
      behavior: 'FF',
      feature: 'ADDRESS',
      candidateCap: 777,
    });
    const after = rows(updated);

    expect(after).toHaveLength(before.length);
    expect(after.filter(isTarget)).toHaveLength(1);
    expect(after[targetIdx]).toEqual({ ...before[targetIdx], CANDIDATE_CAP: 777 });
    after.forEach((r, i) => {
      if (i !== targetIdx) expect(r).toEqual(before[i]);
    });
  });

  test('setGenericThreshold without feature updates only the all-features row', () => {
    const before = rows(stock);
    const gplan = idOf(stock, 'CFG_GPLAN', 'GPLAN_CODE', 'GPLAN_ID', 'INGEST');
    const targetIdx = before.findIndex((r) => r.GPLAN_ID === gplan && r.BEHAVIOR === 'NAME' && r.FTYPE_ID === 0);
    expect(targetIdx).toBeGreaterThanOrEqual(0);

    const updated = configtool.setGenericThreshold(stock, {
      plan: 'INGEST',
      behavior: 'NAME',
      scoringCap: 55,
      sendToRedo: 'no',
    });
    const after = rows(updated);
    expect(after).toHaveLength(before.length);
    expect(after[targetIdx]).toEqual({ ...before[targetIdx], SCORING_CAP: 55, SEND_TO_REDO: 'No' });
    after.forEach((r, i) => {
      if (i !== targetIdx) expect(r).toEqual(before[i]);
    });
  });

  test('add then set on a new feature leaves exactly one row', () => {
    const added = configtool.addGenericThreshold(stock, {
      plan: 'SEARCH',
      behavior: 'FF',
      feature: 'PHONE',
      candidateCap: 10,
      scoringCap: -1,
      sendToRedo: 'No',
    });
    expect(rows(added)).toHaveLength(rows(stock).length + 1);
    const updated = configtool.setGenericThreshold(added, {
      plan: 'SEARCH',
      behavior: 'FF',
      feature: 'PHONE',
      candidateCap: 20,
    });
    const phone = idOf(stock, 'CFG_FTYPE', 'FTYPE_CODE', 'FTYPE_ID', 'PHONE');
    const matches = rows(updated).filter((r) => r.BEHAVIOR === 'FF' && r.FTYPE_ID === phone && r.GPLAN_ID === 2);
    expect(rows(updated)).toHaveLength(rows(added).length);
    expect(matches).toHaveLength(1);
    expect(matches[0].CANDIDATE_CAP).toBe(20);
  });

  test('setGenericThreshold on a missing row is NotFound (never appends)', () => {
    expectConfigError(
      () => configtool.setGenericThreshold(stock, { plan: 'SEARCH', behavior: 'FF', feature: 'PHONE', candidateCap: 1 }),
      'NotFound',
    );
  });

  test('addGenericThreshold validation failures are structured', () => {
    const err = expectConfigError(
      () =>
        configtool.addGenericThreshold(stock, {
          plan: 'SEARCH',
          behavior: 'BOGUS',
          feature: 'PHONE',
          candidateCap: 1,
          scoringCap: 1,
          sendToRedo: 'perhaps',
        }),
      'ValidationErrors',
    );
    expect(err.failures).toEqual([
      { field: 'behavior', reasonCode: 'UNKNOWN_REFERENCE_CODE', offendingValue: 'BOGUS' },
      { field: 'sendToRedo', reasonCode: 'OUT_OF_DOMAIN', offendingValue: 'perhaps' },
    ]);
  });
});

describe('comparison thresholds (stock template)', () => {
  const rows = (cfg: string) => section(cfg, 'CFG_CFRTN');

  test('setComparisonThreshold updates exactly one row', () => {
    const before = rows(stock);
    const cfunc = idOf(stock, 'CFG_CFUNC', 'CFUNC_CODE', 'CFUNC_ID', 'ID_COMP');
    const ftype = idOf(stock, 'CFG_FTYPE', 'FTYPE_CODE', 'FTYPE_ID', 'NATIONAL_ID');
    const targetIdx = before.findIndex(
      (r) => r.CFUNC_ID === cfunc && r.FTYPE_ID === ftype && r.CFUNC_RTNVAL === 'FULL_SCORE',
    );
    expect(targetIdx).toBeGreaterThanOrEqual(0);

    const updated = configtool.setComparisonThreshold(stock, {
      cfuncCode: 'ID_COMP',
      ftypeCode: 'NATIONAL_ID',
      cfuncRtnval: 'FULL_SCORE',
      closeScore: 91,
      likelyScore: 81,
    });
    const after = rows(updated);
    expect(after).toHaveLength(before.length);
    expect(after[targetIdx]).toEqual({ ...before[targetIdx], CLOSE_SCORE: 91, LIKELY_SCORE: 81 });
    after.forEach((r, i) => {
      if (i !== targetIdx) expect(r).toEqual(before[i]);
    });
  });

  test('deleteComparisonThreshold: explicit rtnval, unique legacy 3-arg form, ambiguous legacy form', () => {
    const n = rows(stock).length;
    expect(rows(configtool.deleteComparisonThreshold(stock, 'ID_COMP', 'NATIONAL_ID', 'FULL_SCORE'))).toHaveLength(n - 1);
    expect(rows(configtool.deleteComparisonThreshold(stock, 'ID_COMP', 'NATIONAL_ID'))).toHaveLength(n - 1);

    // A comparison function with several all-features (FTYPE_ID 0) score rows.
    const counts = new Map<unknown, number>();
    for (const r of rows(stock)) if (r.FTYPE_ID === 0) counts.set(r.CFUNC_ID, (counts.get(r.CFUNC_ID) ?? 0) + 1);
    const multi = [...counts].find(([, c]) => c > 1);
    expect(multi, 'stock template has a cfunc with several all-features rows').toBeDefined();
    const multiCode = section(stock, 'CFG_CFUNC').find((f) => f.CFUNC_ID === multi![0])!.CFUNC_CODE;
    expectConfigError(() => configtool.deleteComparisonThreshold(stock, multiCode, 'all'), 'InvalidInput');
    expectConfigError(() => configtool.deleteComparisonThreshold(stock, 'ID_COMP', 'PHONE'), 'NotFound');
  });
});

describe('calls and tri-state updates (stock template)', () => {
  test('getComparisonCall accepts a call id or a feature code', () => {
    const byId = JSON.parse(configtool.getComparisonCall(stock, 1));
    const ftypeCode = section(stock, 'CFG_FTYPE').find((f) => f.FTYPE_ID === byId.FTYPE_ID)!.FTYPE_CODE;
    expect(JSON.parse(configtool.getComparisonCall(stock, ftypeCode))).toEqual(byId);
  });

  test('deleteComparisonCallElement by element code and by legacy ids remove one BOM row', () => {
    const bom = section(stock, 'CFG_CFBOM');
    const row = bom.find((r) => r.CFCALL_ID === 1)!;
    const felemCode = section(stock, 'CFG_FELEM').find((f) => f.FELEM_ID === row.FELEM_ID)!.FELEM_CODE;

    const byCode = configtool.deleteComparisonCallElement(stock, { cfcallId: 1, element: felemCode });
    const byIds = configtool.deleteComparisonCallElement(stock, {
      cfcallId: 1,
      ftypeId: row.FTYPE_ID,
      felemId: row.FELEM_ID,
      execOrder: row.EXEC_ORDER,
    });
    for (const cfg of [byCode, byIds]) {
      const left = section(cfg, 'CFG_CFBOM');
      expect(left).toHaveLength(bom.length - 1);
      expect(left.find((r) => r.CFCALL_ID === 1 && r.FELEM_ID === row.FELEM_ID)).toBeUndefined();
    }
    expectConfigError(() => configtool.deleteComparisonCallElement(stock, { cfcallId: 1 }), 'MissingField');
  });

  test('setRule: undefined leaves, null clears, value sets', () => {
    const rule = section(stock, 'CFG_ERRULE').find((r) => r.DISQ_ERFRAG_CODE)!;
    const code = rule.ERRULE_CODE as string;
    const get = (cfg: string) => section(cfg, 'CFG_ERRULE').find((r) => r.ERRULE_CODE === code)!;

    const untouched = configtool.setRule(stock, { code });
    expect(get(untouched)).toEqual(rule);

    const cleared = configtool.setRule(stock, { code, disqualifier: null });
    expect(get(cleared)).toEqual({ ...rule, DISQ_ERFRAG_CODE: null });

    const tiered = configtool.setRule(stock, { code, tier: (rule.ERRULE_TIER as number) + 1 });
    expect(get(tiered)).toEqual({ ...rule, ERRULE_TIER: (rule.ERRULE_TIER as number) + 1 });
  });
});
