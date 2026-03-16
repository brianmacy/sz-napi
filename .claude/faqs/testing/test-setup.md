## Test Setup Requirements

### SDK integration tests
1. Senzing runtime must be installed
2. `DYLD_LIBRARY_PATH` must be set (both parent process and vitest.config.ts env)
3. SQLite database must be initialized with schema before creating SzEnvironment
4. Config must be registered and activated before getting engine/diagnostic
5. Singleton pattern: only ONE SzEnvironment per process — share across all tests in a single file

### ConfigTool unit tests
No runtime needed. Use fixture config JSON files from `__tests__/fixtures/`.

### Test database lifecycle
```typescript
beforeAll(() => {
  execSync(`sqlite3 ${DB_PATH} < ${SCHEMA_SQL_PATH}`);  // init schema
  env = new SzEnvironment('test', settings);
  configMgr = env.getConfigManager();
  // register config, then get engine
});

afterAll(() => {
  env.destroy();
  fs.unlinkSync(DB_PATH);  // clean up
});
```

### Initialization order
1. `initTestDatabase()` — SQLite schema
2. `new SzEnvironment(...)` — creates singleton
3. `env.getConfigManager()` — works immediately
4. `env.getProduct()` — works immediately
5. `configMgr.createConfig()` + `addDataSource()` + `registerConfig()` + `setDefaultConfigId()` — register config
6. `env.reinitialize(configId)` — activate config
7. `env.getEngine()` — NOW works
8. `env.getDiagnostic()` — NOW works
