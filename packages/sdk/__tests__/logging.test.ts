/**
 * SzLogging integration tests against the real native libSzLogging (Senzing 4.5.0, no mocks).
 *
 * Logging is process-global native state. vitest runs each test file in its own process, and the
 * tests in this file run sequentially; each test resets the default output, format and level
 * (NULL / LEGACY / ERROR) first and the file restores STDERR / LEGACY / ERROR at the end. Tests
 * that need fresh native state, or that leave a registration in place for good, run in a child
 * process (`child`).
 *
 * The 4.5.0 usage rule is followed throughout: registrations and default-output changes happen
 * only while no engine is initialized. Log traffic comes from a real engine lifecycle
 * (`runEngine`: environment, config manager, engine, one record, destroy). Its config-manager
 * init logs `SzConfigMgr_init([<module name>], ...)` at TRACE, so each lifecycle's records can be
 * told apart by the module name passed to the environment.
 *
 * Records are delivered asynchronously on the JS thread, so tests `await settle(...)` before
 * asserting on what a callback received.
 */
import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';
import { Worker } from 'worker_threads';

const sdk = require('../sdk.js');

const {
  SzEnvironment,
  getLogging,
  SzLogging,
  SzLogRegistration,
  SzLogLevel,
  SzLogFormat,
  SzBadInputError,
  SzConfigurationError,
} = sdk;

type LogRecord = {
  level: string;
  module: string;
  threadHash?: string;
  message: string;
  timestampNs?: bigint;
  threadId?: bigint;
};

const NEWER = 'requires Senzing >= 4.5.1/4.6.0';
const LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL', 'OFF'];
const FORMATS = ['LEGACY', 'JSONL', 'BARE', 'DEFAULT'];

const isMac = process.platform === 'darwin';
// SENZING_DIR (the `er` directory, as for the sz-rust-sdk build) overrides the platform default.
const senzingBase = process.env.SENZING_DIR || (isMac ? '/opt/homebrew/opt/senzing/er' : '/opt/senzing/er');
const supportPath = path.join(senzingBase, '..', 'data');
const schemaPath = path.join(senzingBase, 'resources/schema/szcore-schema-sqlite-create.sql');
const dbPath = path.join(os.tmpdir(), `sz-logging-test-${process.pid}.db`);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'sz-logging-test-'));
const settings = JSON.stringify({
  PIPELINE: {
    CONFIGPATH: path.join(senzingBase, 'resources/templates'),
    RESOURCEPATH: path.join(senzingBase, 'resources'),
    SUPPORTPATH: supportPath,
  },
  SQL: { CONNECTION: `sqlite3://na:na@${dbPath}` },
});

const canRun = fs.existsSync(schemaPath);
const describeIfRuntime = canRun ? describe : describe.skip;

let lifecycles = 0;

/** A logging interface: the module-level getter needs no environment. */
function logging() {
  return getLogging();
}

/**
 * Runs one full engine lifecycle and destroys it, so nothing logs afterwards. Returns the module
 * name, which appears in the TRACE `SzConfigMgr_init([<name>], ...)` message.
 */
function runEngine(): string {
  lifecycles += 1;
  const name = `sz-logging-run-${lifecycles}`;
  const env = new SzEnvironment(name, settings);
  try {
    env.getConfigManager();
    const engine = env.getEngine();
    engine.addRecord('TEST', `LOG_${lifecycles}`, '{"NAME_FULL": "Robert Smith"}');
  } finally {
    env.destroy();
  }
  return name;
}

/** Waits until every array stops growing (records arrive asynchronously). */
async function settle(...arrays: unknown[][]): Promise<void> {
  const total = () => arrays.reduce((sum, a) => sum + a.length, 0);
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 200 && stable < 5; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const now = total();
    stable = now === last ? stable + 1 : 0;
    last = now;
  }
}

/** The TRACE `SzConfigMgr_init` record of the lifecycle `name`. */
function initRecord(records: LogRecord[], name: string): LogRecord | undefined {
  return records.find((r) => r.message.includes(`SzConfigMgr_init([${name}]`));
}

const sdkPath = path.join(__dirname, '..', 'sdk.js');

/**
 * Runs `body` in a fresh Node.js process (fresh native logging state) and returns the JSON the
 * body prints on its last stdout line as `result`. The preamble defines `sdk`, `log` (default
 * output NULL), `settings`, `runEngine(name)` and `settle(count)`.
 */
function child(body: string, nodeArgs: string[] = []) {
  const script = `
    const sdk = require(${JSON.stringify(sdkPath)});
    const settings = process.env.SZ_LOGGING_TEST_SETTINGS;
    const log = sdk.getLogging();
    log.setDefaultOutput({ type: 'NULL' });
    function runEngine(name, verbose) {
      const env = new sdk.SzEnvironment(name, settings, verbose);
      try {
        env.getEngine().addRecord('TEST', name, '{"NAME_FULL": "Robert Smith"}');
      } finally {
        env.destroy();
      }
    }
    async function settle(count) {
      let last = -1;
      for (let stable = 0, i = 0; i < 200 && stable < 5; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 20));
        stable = count() === last ? stable + 1 : 0;
        last = count();
      }
    }
    ${body}
  `;
  const run = spawnSync(process.execPath, [...nodeArgs, '-e', script], {
    encoding: 'utf8',
    timeout: 30000,
    env: { ...process.env, SZ_LOGGING_TEST_SETTINGS: settings },
  });
  const lines = run.stdout.trim().split('\n');
  let result: any;
  try {
    result = JSON.parse(lines[lines.length - 1]);
  } catch {
    result = undefined;
  }
  return { ...run, result };
}

/** Asserts the "requires a newer Senzing" stub error naming `fn`. */
function expectRequiresNewer(call: () => unknown, fn: string) {
  let error: any;
  try {
    call();
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(SzConfigurationError);
  expect(error.message).toContain(NEWER);
  expect(error.message).toContain(fn);
}

describeIfRuntime('SzLogging (native libSzLogging)', () => {
  beforeAll(() => {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    execSync(`sqlite3 "${dbPath}" < "${schemaPath}"`);
    const env = new SzEnvironment('sz-logging-setup', settings);
    try {
      const configManager = env.getConfigManager();
      // The stock template already defines the TEST data source.
      configManager.setDefaultConfig(configManager.createConfig(), 'logging test config');
    } finally {
      env.destroy();
    }
  });

  beforeEach(() => {
    const log = logging();
    log.setDefaultOutput({ type: 'NULL' });
    // Senzing 4.5.0 resets the format on setDefaultOutput; 4.5.1 / 4.6.0 keep it. Reset it here.
    log.setDefaultFormat('LEGACY');
    log.setDefaultLogLevel('ERROR');
  });

  afterAll(() => {
    const log = logging();
    log.setDefaultOutput({ type: 'STDERR' });
    log.setDefaultFormat('LEGACY');
    log.setDefaultLogLevel('ERROR');
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    fs.rmSync(scratch, { recursive: true, force: true });
  });

  // -- Constants ----------------------------------------------------------------

  test('SzLogLevel and SzLogFormat are frozen constants built from the binding', () => {
    expect(SzLogLevel.ALL).toEqual(LEVELS);
    expect(SzLogLevel.Warn).toBe('WARN');
    expect(SzLogLevel.Critical).toBe('CRITICAL');
    expect(SzLogFormat.ALL).toEqual(FORMATS);
    expect(SzLogFormat.Jsonl).toBe('JSONL');
    for (const constants of [SzLogLevel, SzLogFormat]) {
      expect(Object.isFrozen(constants)).toBe(true);
      expect(Object.isFrozen(constants.ALL)).toBe(true);
    }
  });

  // -- getLogging ---------------------------------------------------------------

  test('getLogging works before init and after destroy, and shares native state', () => {
    const env = new SzEnvironment('sz-logging-getter', settings);
    const before = env.getLogging();
    expect(before).toBeInstanceOf(SzLogging);
    env.destroy();
    const after = env.getLogging();
    expect(after).toBeInstanceOf(SzLogging);

    after.setDefaultLogLevel('CRITICAL');
    expect(before.getEffectiveLogLevel()).toBe('CRITICAL');
    before.setDefaultLogLevel('ERROR');
    expect(after.getEffectiveLogLevel()).toBe('ERROR');
  });

  test('module-level getLogging needs no environment and never blocks destroy()', () => {
    const log = getLogging();
    expect(log).toBeInstanceOf(SzLogging);
    const env = new SzEnvironment('sz-logging-module', settings);
    const fromEnv = env.getLogging();
    env.getEngine();
    env.destroy(); // `log` is no environment handle, so nothing else holds the singleton
    expect(env.isDestroyed()).toBe(true);

    log.setDefaultLogLevel('CRITICAL');
    expect(fromEnv.getEffectiveLogLevel()).toBe('CRITICAL');
    fromEnv.setDefaultLogLevel('ERROR');
    expect(log.getEffectiveLogLevel()).toBe('ERROR');
  });

  // -- Levels ------------------------------------------------------------------

  test('setDefaultLogLevel / getEffectiveLogLevel: min over sinks, case-insensitive', () => {
    const log = logging();
    for (const level of LEVELS) {
      log.setDefaultLogLevel(level);
      expect(log.getEffectiveLogLevel()).toBe(level);
    }
    log.setDefaultLogLevel('warning');
    expect(log.getEffectiveLogLevel()).toBe('WARN');
    log.setDefaultLogLevel(' info ');
    expect(log.getEffectiveLogLevel()).toBe('INFO');

    log.setDefaultLogLevel(SzLogLevel.Error);
    const debug = log.registerCallback(SzLogLevel.Debug, () => {});
    expect(log.getEffectiveLogLevel()).toBe('DEBUG');
    debug.unregister();
    expect(log.getEffectiveLogLevel()).toBe('ERROR');
  });

  test('unknown levels and formats are SzBadInputError', () => {
    const log = logging();
    expect(() => log.setDefaultLogLevel('VERBOSE')).toThrow(SzBadInputError);
    expect(() => log.setDefaultFormat('XML')).toThrow(SzBadInputError);
    expect(() => log.registerCallback('VERBOSE', () => {})).toThrow(/unknown log level/);
    expect(() => log.registerCallback({ minLevel: 'INFO', format: 'xml' }, () => {})).toThrow(
      SzBadInputError,
    );
    expect(() => log.setDefaultCallback('LOUD', () => {})).toThrow(SzBadInputError);
    expect(log.getEffectiveLogLevel()).toBe('ERROR');
  });

  test('wrong argument shapes are SzBadInputError naming the field, before anything is registered', () => {
    const log = logging();
    const registration = log.registerCallback('ERROR', () => {});
    const fn = () => {};
    const cases: [() => unknown, RegExp][] = [
      [() => log.registerCallback({}, fn), /options\.minLevel must be a log level name \(string\), got undefined/],
      [() => log.registerCallback('INFO', 42), /callback must be a function, got 42/],
      [() => log.registerCallback(7, fn), /options must be a log level name or \{ minLevel, format\?, maxQueued\? \}, got 7/],
      [() => log.registerCallback(null, fn), /options must be .*got null/],
      [() => log.registerCallback(['INFO'], fn), /options must be/],
      [() => log.registerCallback({ minLevel: 'INFO', format: 3 }, fn), /options\.format must be a log format name/],
      [() => log.registerCallback({ minLevel: 'INFO', maxQueued: 0 }, fn), /options\.maxQueued must be an integer from 1 to 4294967295, got 0/],
      [() => log.registerCallback({ minLevel: 'INFO', maxQueued: 1.5 }, fn), /options\.maxQueued/],
      [() => log.registerCallback({ minLevel: 'INFO', maxQueued: '10' }, fn), /options\.maxQueued/],
      [() => log.registerThreadLocalCallback('INFO', undefined), /callback must be a function/],
      [() => log.setDefaultCallback('INFO', 'not a function'), /callback must be a function, got 'not a function'/],
      [() => log.captureThreadLogs({ format: 'JSONL' }), /options\.minLevel/],
      [() => log.setDefaultOutput('STDERR'), /output must be \{ type, path\?, append\? \}/],
      [() => log.setDefaultOutput({ type: 1 }), /output\.type must be a string, got 1/],
      [() => log.setDefaultOutput({ type: 'FILE', path: 5 }), /output\.path must be a string/],
      [() => log.setDefaultOutput({ type: 'FILE', path: 'x.log', append: 'yes' }), /output\.append must be a boolean/],
      [() => log.setDefaultLogLevel(3), /level must be a log level name \(string\), got 3/],
      [() => log.setDefaultFormat(undefined), /format must be a log format name/],
      [() => registration.setLevel(null), /level must be a log level name/],
    ];
    try {
      for (const [call, message] of cases) {
        expect(call).toThrow(SzBadInputError);
        expect(call).toThrow(message);
      }
    } finally {
      registration.unregister();
    }
    expect(log.getEffectiveLogLevel()).toBe('ERROR');
    expect(fs.existsSync('x.log')).toBe(false);
  });

  // -- Delivery ------------------------------------------------------------------

  test('registerCallback delivers engine records asynchronously as plain objects', async () => {
    const log = logging();
    const records: LogRecord[] = [];
    const registration = log.registerCallback('TRACE', (r: LogRecord) => records.push(r));
    expect(registration).toBeInstanceOf(SzLogRegistration);

    const name = runEngine();
    expect(records).toHaveLength(0); // the JS thread was busy: nothing delivered yet
    registration.unregister(); // after destroy; queued records are still delivered
    await settle(records);

    expect(records.length).toBeGreaterThan(0);
    const init = initRecord(records, name);
    expect(init).toBeDefined();
    expect(init!.level).toBe('TRACE');
    expect(init!.module).toBe('szstatic');
    expect(init!.threadHash).toMatch(/^[0-9a-f]+$/);
    expect(init!.message.startsWith('SzConfigMgr_init(')).toBe(true);
    // Senzing 4.5.0 callbacks receive neither the time nor the thread id.
    expect(init!.timestampNs).toBeUndefined();
    expect(init!.threadId).toBeUndefined();
    for (const r of records) {
      expect(LEVELS.slice(0, -1)).toContain(r.level);
      expect(typeof r.module).toBe('string');
      expect(r.module.length).toBeGreaterThan(0);
      expect(typeof r.message).toBe('string');
    }
  });

  test('unregister stops delivery and is idempotent', async () => {
    const log = logging();
    const records: LogRecord[] = [];
    const registration = log.registerCallback('TRACE', (r: LogRecord) => records.push(r));
    registration.unregister();
    registration.unregister();
    expect(log.getEffectiveLogLevel()).toBe('ERROR');
    runEngine();
    await settle(records);
    expect(records).toHaveLength(0);
  });

  test('Symbol.dispose unregisters', async () => {
    const log = logging();
    const records: LogRecord[] = [];
    const registration = log.registerCallback('DEBUG', (r: LogRecord) => records.push(r));
    expect(log.getEffectiveLogLevel()).toBe('DEBUG');
    registration[Symbol.dispose]();
    expect(log.getEffectiveLogLevel()).toBe('ERROR');
    runEngine();
    await settle(records);
    expect(records).toHaveLength(0);
  });

  test('each registration receives exactly the records at or above its level', async () => {
    const log = logging();
    const received: Record<string, LogRecord[]> = {};
    const registrations = LEVELS.map((level) => {
      received[level] = [];
      return log.registerCallback(level, (r: LogRecord) => received[level].push(r));
    });
    runEngine();
    registrations.forEach((r) => r.unregister());
    await settle(...Object.values(received));

    const all = received.TRACE;
    expect(all.length).toBeGreaterThan(0);
    for (const [index, level] of LEVELS.entries()) {
      const expected = all.filter((r) => LEVELS.indexOf(r.level) >= index);
      expect(received[level].map((r) => r.message)).toEqual(expected.map((r) => r.message));
    }
    expect(received.OFF).toHaveLength(0);
  });

  test('registered callbacks get the message in their format (default BARE)', async () => {
    const log = logging();
    const received: Record<string, string[]> = { level: [], object: [] };
    const registrations = [
      log.registerCallback('TRACE', (r: LogRecord) => received.level.push(r.message)),
      log.registerCallback({ minLevel: 'trace' }, (r: LogRecord) => received.object.push(r.message)),
    ];
    for (const format of FORMATS) {
      received[format] = [];
      registrations.push(
        log.registerCallback({ minLevel: 'TRACE', format }, (r: LogRecord) =>
          received[format].push(r.message),
        ),
      );
    }
    received.json = [];
    registrations.push(
      log.registerCallback({ minLevel: 'TRACE', format: 'json' }, (r: LogRecord) =>
        received.json.push(r.message),
      ),
    );
    const name = runEngine();
    registrations.forEach((r) => r.unregister());
    await settle(...Object.values(received));

    const find = (key: string) => received[key].find((m) => m.includes(`SzConfigMgr_init([${name}]`));
    for (const key of ['level', 'object', 'BARE', 'DEFAULT']) {
      expect(find(key)?.startsWith(`SzConfigMgr_init([${name}]`)).toBe(true);
    }
    expect(find('LEGACY')).toMatch(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3} \[szstatic:[0-9a-f]+\] \S+: SzConfigMgr_init\(/);
    for (const key of ['JSONL', 'json']) {
      const json = JSON.parse(find(key)!);
      expect(typeof json.timestamp).toBe('string');
      expect(json.severity).toBe('trace');
      expect(json.module).toMatch(/^szstatic:/);
      expect(json.message.startsWith('SzConfigMgr_init(')).toBe(true);
    }
  });

  test('records logged on other OS threads are delivered on the registering JS thread', async () => {
    const WORKERS = 4;
    const log = logging();
    const records: LogRecord[] = [];
    const registration = log.registerCallback('TRACE', (r: LogRecord) => records.push(r));

    // Each worker thread runs engine calls on its own OS thread against the process-wide
    // environment singleton, then exits (releasing its handles) before the main thread destroys.
    const code = `
      const { workerData } = require('worker_threads');
      const sdk = require(workerData.sdkPath);
      const env = new sdk.SzEnvironment(workerData.name, workerData.settings);
      const engine = env.getEngine();
      for (let i = 0; i < 5; i += 1) {
        engine.addRecord('TEST', workerData.name + '_' + i, '{"NAME_FULL": "Robert Smith ' + i + '"}');
      }
    `;
    const main = new SzEnvironment('sz-logging-workers', settings);
    main.getEngine();
    const exits = Array.from({ length: WORKERS }, (_, t) => {
      const worker = new Worker(code, {
        eval: true,
        workerData: { sdkPath: path.join(__dirname, '..', 'sdk.js'), name: `sz-logging-worker-${t}`, settings },
      });
      return new Promise<number>((resolve, reject) => {
        worker.on('error', reject);
        worker.on('exit', resolve);
      });
    });
    expect(await Promise.all(exits)).toEqual(Array(WORKERS).fill(0));
    main.destroy();
    registration.unregister();
    await settle(records);

    const threads = new Set(records.map((r) => r.threadHash).filter(Boolean));
    expect(threads.size).toBeGreaterThan(1);
  });

  // -- Registration handle ---------------------------------------------------

  test('leak keeps the callback registered; the handle is then released', async () => {
    const log = logging();
    const records: LogRecord[] = [];
    // CRITICAL: a leaked registration lowers the effective level for the rest of the process.
    const registration = log.registerCallback('CRITICAL', (r: LogRecord) => records.push(r));
    registration.leak();
    registration.unregister(); // no-op: already released
    expect(log.getEffectiveLogLevel()).toBe('ERROR');
    expect(registration.getDropped()).toBe(0);
    expect(() => registration.getLevel()).toThrow(SzBadInputError);
    expect(() => registration.setLevel('INFO')).toThrow(/already unregistered or leaked/);
  });

  test('setLevel / getLevel are stubbed until Senzing 4.5.1 / 4.6.0', () => {
    const log = logging();
    const registration = log.registerCallback('ERROR', () => {});
    try {
      expectRequiresNewer(() => registration.setLevel('TRACE'), 'SzLogging_setCallbackLevel');
      expectRequiresNewer(() => registration.getLevel(), 'SzLogging_getCallbackLevel');
      expect(() => registration.setLevel('LOUD')).toThrow(SzBadInputError);
    } finally {
      registration.unregister();
    }
    expect(() => registration.getLevel()).toThrow(SzBadInputError);
    expect(registration.level).toBeUndefined();
  });

  // -- Stubs -------------------------------------------------------------------

  test('default getters are stubbed until Senzing 4.5.1 / 4.6.0', () => {
    const log = logging();
    expectRequiresNewer(() => log.getDefaultOutput(), 'SzLogging_getDefaultOutput');
    expectRequiresNewer(() => log.getDefaultFormat(), 'SzLogging_getDefaultFormatter');
    expectRequiresNewer(() => log.getDefaultLogLevel(), 'SzLogging_getDefaultLogLevel');
  });

  test('thread-local registration and capture are stubbed on Senzing 4.5.0', () => {
    const log = logging();
    const fn = 'SzLogging_registerThreadLocalCallback';
    expectRequiresNewer(() => log.registerThreadLocalCallback('TRACE', () => {}), fn);
    expectRequiresNewer(
      () => log.registerThreadLocalCallback({ minLevel: 'DEBUG', format: 'JSONL' }, () => {}),
      fn,
    );
    expectRequiresNewer(() => log.captureThreadLogs('TRACE'), fn);
    expectRequiresNewer(() => log.captureThreadLogs({ minLevel: 'INFO' }), fn);
    expect(() => log.captureThreadLogs('LOUD')).toThrow(SzBadInputError);
    expect(log.getEffectiveLogLevel()).toBe('ERROR');
  });

  // -- Default output ------------------------------------------------------------

  test('setDefaultOutput argument errors', () => {
    const log = logging();
    expect(() => log.setDefaultOutput({ type: 'CALLBACK' })).toThrow(SzBadInputError);
    expect(() => log.setDefaultOutput({ type: 'FILE' })).toThrow(/needs a path/);
    expect(() => log.setDefaultOutput({ type: 'FILE', path: '' })).toThrow(/empty/);
    expect(() => log.setDefaultOutput({ type: 'SYSLOG' })).toThrow(/unknown log output type/);
    const appendPath = path.join(scratch, 'append.log');
    expectRequiresNewer(
      () => log.setDefaultOutput({ type: 'FILE', path: appendPath, append: true }),
      'SZ_LOG_OUTPUT_FILE_APPEND',
    );
    expect(fs.existsSync(appendPath)).toBe(false);
  });

  test('every settable output kind is accepted, case-insensitively', () => {
    const log = logging();
    for (const type of ['STDERR', 'stdout', 'Null', 'NULL']) {
      log.setDefaultOutput({ type });
    }
    for (const format of [...FORMATS, 'json', 'bare']) {
      log.setDefaultFormat(format);
    }
    log.setDefaultOutput({ type: 'NULL' });
  });

  test('an unopenable file is SzBadInputError naming the path', () => {
    const log = logging();
    const blocker = path.join(scratch, 'not-a-directory');
    fs.writeFileSync(blocker, '');
    const target = path.join(blocker, 'rejected.log');
    let error: any;
    try {
      log.setDefaultOutput({ type: 'FILE', path: target });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(SzBadInputError);
    expect(error.message).toContain('rejected.log');
  });

  test('a FILE output creates parent directories, truncates, and receives engine messages', () => {
    const log = logging();
    const file = path.join(scratch, 'missing', 'nested', 'sz.log');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'PREEXISTING\n');
    fs.rmSync(path.join(scratch, 'missing'), { recursive: true });

    log.setDefaultOutput({ type: 'FILE', path: file });
    expect(fs.existsSync(file)).toBe(true);
    fs.writeFileSync(file, 'PREEXISTING\n');
    log.setDefaultOutput({ type: 'FILE', path: file }); // native truncates when it opens
    log.setDefaultFormat(SzLogFormat.Legacy); // after the output: 4.5.0 resets it, 4.5.1+ keeps it
    log.setDefaultLogLevel('TRACE');
    const name = runEngine();
    log.setDefaultOutput({ type: 'NULL' }); // 4.5.0: destroy() does not flush; replacing does

    const text = fs.readFileSync(file, 'utf8');
    expect(text).not.toContain('PREEXISTING');
    const line = text.split('\n').find((l) => l.includes(`SzConfigMgr_init([${name}]`));
    expect(line).toMatch(/\[szstatic:[0-9a-f]+\] TRCE: SzConfigMgr_init\(/);
  });

  test('the default output writes JSONL when the format is set after the output', () => {
    const log = logging();
    const file = path.join(scratch, 'default.jsonl');
    log.setDefaultOutput({ type: 'FILE', path: file });
    log.setDefaultFormat(SzLogFormat.Jsonl); // 4.5.0: setDefaultOutput resets the format
    log.setDefaultLogLevel(SzLogLevel.Trace);
    const name = runEngine();
    log.setDefaultOutput({ type: 'NULL' });

    const line = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .find((l) => l.includes(`SzConfigMgr_init([${name}]`));
    const json = JSON.parse(line!);
    expect(json.severity).toBe('trace');
    expect(json.module).toMatch(/^szstatic:/);
    expect(typeof json.timestamp).toBe('string');
  });

  // -- Default callback --------------------------------------------------------

  test('setDefaultCallback delivers at its level and is replaced by setDefaultOutput', async () => {
    const log = logging();
    const first: LogRecord[] = [];
    log.setDefaultCallback({ minLevel: 'WARN', format: 'BARE' }, (r: LogRecord) => first.push(r));
    expect(log.getEffectiveLogLevel()).toBe('WARN');
    runEngine();
    await settle(first);
    expect(first.length).toBeGreaterThan(0);
    for (const r of first) {
      expect(['WARN', 'ERROR', 'CRITICAL']).toContain(r.level);
      expect(r.message).not.toMatch(/^\d{4}-/); // BARE: no LEGACY prefix
    }

    const count = first.length;
    log.setDefaultOutput({ type: 'NULL' });
    runEngine();
    await settle(first);
    expect(first).toHaveLength(count);
  });

  test('a replaced default callback is no longer called', async () => {
    const log = logging();
    const first: LogRecord[] = [];
    const second: LogRecord[] = [];
    log.setDefaultCallback('TRACE', (r: LogRecord) => first.push(r));
    log.setDefaultCallback('TRACE', (r: LogRecord) => second.push(r));
    const name = runEngine();
    log.setDefaultOutput({ type: 'NULL' });
    await settle(first, second);
    expect(first).toHaveLength(0);
    expect(initRecord(second, name)?.message.startsWith('SzConfigMgr_init(')).toBe(true);
  });

  // -- Process lifetime --------------------------------------------------------

  test('registrations and default callbacks do not keep the process alive', () => {
    const script = `
      const sdk = require(${JSON.stringify(path.join(__dirname, '..', 'sdk.js'))});
      const logging = new sdk.SzEnvironment('sz-logging-exit', '{}').getLogging();
      logging.setDefaultOutput({ type: 'NULL' });
      logging.registerCallback('TRACE', () => {});
      logging.setDefaultCallback('ERROR', () => {});
      console.log('registered');
    `;
    const result = spawnSync(process.execPath, ['-e', script], {
      encoding: 'utf8',
      timeout: 20000,
      env: process.env,
    });
    expect(result.error).toBeUndefined();
    expect(result.signal).toBeNull();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('registered');
  });

  test('process exit with a live, undestroyed engine and a live registration is clean', () => {
    for (const exit of ['', 'process.exit(0);']) {
      const run = child(`
        log.registerCallback('TRACE', () => {});
        const env = new sdk.SzEnvironment('sz-logging-live-exit', settings);
        env.getEngine().addRecord('TEST', 'LIVE_EXIT', '{"NAME_FULL": "Robert Smith"}');
        console.log(JSON.stringify({ done: true }));
        ${exit}
      `);
      expect(run.error).toBeUndefined();
      expect(run.signal).toBeNull();
      expect(run.status).toBe(0);
      expect(run.result).toEqual({ done: true });
    }
  });

  // -- Queue cap -----------------------------------------------------------------

  test('maxQueued caps undelivered records, drops and counts the rest, and frees slots on delivery', async () => {
    const log = logging();
    const all: LogRecord[] = [];
    const capped: LogRecord[] = [];
    const unbounded = log.registerCallback('TRACE', (r: LogRecord) => all.push(r));
    const registration = log.registerCallback({ minLevel: 'TRACE', maxQueued: 5 }, (r: LogRecord) =>
      capped.push(r),
    );
    expect(unbounded.getDropped()).toBe(0);

    // The JS thread is busy for the whole synchronous lifecycle, so nothing is delivered during it:
    // the first 5 records are queued and every later one is dropped.
    runEngine();
    await settle(all, capped);
    expect(capped).toHaveLength(5);
    const droppedFirst = registration.getDropped();
    expect(droppedFirst).toBeGreaterThan(0);
    expect(all).toHaveLength(capped.length + droppedFirst);
    expect(capped.map((r) => r.message)).toEqual(all.slice(0, 5).map((r) => r.message));

    // Delivered records released their slots: the next lifecycle queues 5 more.
    runEngine();
    unbounded.unregister();
    registration.unregister();
    await settle(all, capped);
    expect(capped).toHaveLength(10);
    expect(all).toHaveLength(capped.length + registration.getDropped()); // still readable
    expect(unbounded.getDropped()).toBe(0);
  });

  // -- Re-entrancy ---------------------------------------------------------------

  test('a callback may unregister itself and call SzLogging; queued records are still delivered', async () => {
    const log = logging();
    const records: LogRecord[] = [];
    const inside: string[] = [];
    let nested: any;
    const registration = log.registerCallback('TRACE', (r: LogRecord) => {
      records.push(r);
      if (records.length === 1) {
        // Runs on the event loop after runEngine() returned (destroy() done): the 4.5.0 usage
        // rule holds, and none of this runs on native's logging stack.
        registration.unregister();
        nested = log.registerCallback('DEBUG', () => {});
        inside.push(log.getEffectiveLogLevel());
        nested.unregister();
        log.setDefaultLogLevel('ERROR');
        inside.push(log.getEffectiveLogLevel());
      }
    });
    const name = runEngine();
    await settle(records);

    expect(inside).toEqual(['DEBUG', 'ERROR']);
    expect(records.length).toBeGreaterThan(1); // queued before the unregister: still delivered
    expect(initRecord(records, name)).toBeDefined();

    const count = records.length;
    runEngine();
    await settle(records);
    expect(records).toHaveLength(count);
  });

  // -- Default callback format ---------------------------------------------------

  test('setDefaultCallback with format JSONL delivers JSON lines', async () => {
    const log = logging();
    const records: LogRecord[] = [];
    log.setDefaultCallback({ minLevel: 'TRACE', format: 'JSONL' }, (r: LogRecord) => records.push(r));
    const name = runEngine();
    log.setDefaultOutput({ type: 'NULL' });
    await settle(records);

    const init = initRecord(records, name);
    expect(init?.level).toBe('TRACE');
    const json = JSON.parse(init!.message);
    expect(json.severity).toBe('trace');
    expect(json.module).toMatch(/^szstatic:/);
    expect(typeof json.timestamp).toBe('string');
    expect(json.message.startsWith(`SzConfigMgr_init([${name}]`)).toBe(true);
  });

  // -- Child processes: uncaught exceptions, workers, GC, verboseLogging ----------

  test('a throwing callback is an uncaughtException and delivery continues', () => {
    const run = child(`
      let calls = 0;
      const errors = [];
      process.on('uncaughtException', (e) => errors.push(e.message));
      const registration = log.registerCallback('TRACE', () => {
        calls += 1;
        if (calls === 1) throw new Error('callback failed');
      });
      runEngine('sz-logging-throw');
      settle(() => calls).then(() => {
        registration.unregister();
        console.log(JSON.stringify({ calls, errors }));
      });
    `);
    expect(run.status).toBe(0);
    expect(run.result.errors).toEqual(['callback failed']);
    expect(run.result.calls).toBeGreaterThan(1);
  });

  test('a worker that exits without unregistering: no crash, level stays pinned, main keeps working', () => {
    const run = child(`
      const { Worker } = require('worker_threads');
      const worker = new Worker(
        "require(require('worker_threads').workerData).getLogging().registerCallback('TRACE', () => {});",
        { eval: true, workerData: ${JSON.stringify(sdkPath)} },
      );
      worker.on('exit', (code) => {
        const pinned = log.getEffectiveLogLevel();
        const records = [];
        const registration = log.registerCallback('INFO', (r) => records.push(r));
        runEngine('sz-logging-worker-gone'); // records also reach the dead worker's registration
        registration.unregister();
        settle(() => records.length).then(() => {
          console.log(JSON.stringify({ code, pinned, records: records.length }));
        });
      });
    `);
    expect(run.signal).toBeNull();
    expect(run.status).toBe(0);
    expect(run.result).toMatchObject({ code: 0, pinned: 'TRACE' });
    expect(run.result.records).toBeGreaterThan(0);
  });

  test('GC never unregisters; a collected registration warns once', () => {
    const run = child(
      `
      const warnings = [];
      process.on('warning', (w) => warnings.push({ code: w.code, message: w.message }));
      const records = [];
      (() => { log.registerCallback('trace', (r) => records.push(r)); })();
      (() => { log.registerCallback('DEBUG', () => {}).unregister(); })();
      (() => { log.registerCallback({ minLevel: 'CRITICAL' }, () => {}).leak(); })();
      (async () => {
        for (let i = 0; i < 20 && warnings.length === 0; i += 1) {
          global.gc();
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        const effective = log.getEffectiveLogLevel();
        runEngine('sz-logging-gc');
        await settle(() => records.length);
        console.log(JSON.stringify({ warnings, effective, records: records.length }));
      })();
    `,
      ['--expose-gc'],
    );
    expect(run.status).toBe(0);
    expect(run.result.warnings).toHaveLength(1);
    expect(run.result.warnings[0].code).toBe('SZ_LOG_REGISTRATION_COLLECTED');
    expect(run.result.warnings[0].message).toContain('minLevel TRACE');
    expect(run.result.effective).toBe('TRACE'); // still registered
    expect(run.result.records).toBeGreaterThan(0); // and still delivering
  });

  test('verboseLogging raises the default level only until the application configures logging', () => {
    const levelAfterVerboseInit = (configure: string) => {
      const run = child(`
        ${configure}
        runEngine('sz-logging-verbose', true);
        console.log(JSON.stringify({ level: log.getEffectiveLogLevel() }));
      `);
      expect(run.status).toBe(0);
      return run.result.level;
    };
    const verbose = levelAfterVerboseInit('');
    expect(LEVELS.indexOf(verbose)).toBeLessThan(LEVELS.indexOf('ERROR'));
    expect(levelAfterVerboseInit("log.setDefaultLogLevel('ERROR');")).toBe('ERROR');
    expect(levelAfterVerboseInit("log.setDefaultFormat('LEGACY');")).toBe('ERROR');
    expect(levelAfterVerboseInit("log.setDefaultCallback('ERROR', () => {});")).toBe('ERROR');
  });
});
