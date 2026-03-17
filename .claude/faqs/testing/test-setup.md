## Test Setup Requirements

### SDK integration tests

1. Senzing runtime must be installed
2. SQLite database must be initialized with schema before creating SzEnvironment
3. Config must be registered and activated before getting engine/diagnostic
4. Singleton pattern: only ONE SzEnvironment per process — share across all tests in a single file
5. Tests read `SENZING_SETTINGS` env var for CI; fall back to macOS Homebrew paths locally
6. No `DYLD_LIBRARY_PATH` needed — rpath is embedded in the .node binary

### ConfigTool unit tests

No runtime needed. Use fixture config JSON files from `__tests__/fixtures/`.

Error tests use `expect.assertions()` guards to prevent silent pass if tested functions stop throwing.

### Test database lifecycle

```typescript
beforeAll(() => {
  if (!testConfig.externalInit) {
    execSync(`sqlite3 ${testConfig.dbPath} < ${testConfig.schemaPath}`);
  }
  env = new SzEnvironment("test", settings);
  configMgr = env.getConfigManager();
  // register config, then get engine
});

afterAll(() => {
  env.destroy();
  if (!testConfig.externalInit) {
    fs.unlinkSync(testConfig.dbPath);
  }
});
```

### Initialization order

1. `initTestDatabase()` — SQLite schema (skipped when `SENZING_SETTINGS` is set)
2. `new SzEnvironment(...)` — creates singleton
3. `env.getConfigManager()` — works immediately
4. `env.getProduct()` — works immediately
5. `configMgr.createConfig()` + `addDataSource()` + `registerConfig()` + `setDefaultConfigId()` — register config
6. `env.reinitialize(configId)` — activate config
7. `env.getEngine()` — NOW works
8. `env.getDiagnostic()` — NOW works

### CI environment

- SDK tests run on Amazon Linux 2023 containers with `yum install senzingsdk-runtime`
- `SENZING_SETTINGS` env var provides the settings JSON
- The test's `getTestConfig()` function parses `SENZING_SETTINGS` to extract DB path and schema path
- Examples also run in CI after the test suite
