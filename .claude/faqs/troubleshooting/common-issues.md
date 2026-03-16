## Common Issues

### "Cannot find native binding"
The `.node` file can't load `libSz.dylib`. Set the library path:
```bash
export DYLD_LIBRARY_PATH=/opt/homebrew/opt/senzing/runtime/er/lib  # macOS
export LD_LIBRARY_PATH=/opt/senzing/er/lib                          # Linux
```

### "unable to open database file"
SQLite database not initialized with Senzing schema. Run:
```bash
sqlite3 /tmp/your-db.db < /opt/homebrew/opt/senzing/runtime/er/resources/schema/szcore-schema-sqlite-create.sql
```

### "No engine configuration registered in datastore"
You must register and activate a config BEFORE calling `getEngine()` or `getDiagnostic()`. Order matters:
1. `env.getConfigManager()` and `env.getProduct()` work immediately
2. `configMgr.createConfig()` + `registerConfig()` + `setDefaultConfigId()`
3. `env.reinitialize(configId)`
4. NOW `env.getEngine()` and `env.getDiagnostic()` work

### DYLD_LIBRARY_PATH stripped by macOS SIP
macOS System Integrity Protection strips `DYLD_LIBRARY_PATH` from child processes. For vitest, set it in `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    env: { DYLD_LIBRARY_PATH: '/opt/homebrew/opt/senzing/runtime/er/lib' },
  },
});
```
You still need it on the parent process too.

### napi build overwrites index.js
This is expected. The `index.js` is the auto-generated platform loader. The real entry points are `sdk.js` and `configtool.js` (set in `package.json` `"main"`).

### Plugin initialization error / GNR data files failed to load
Wrong SUPPORTPATH. Use `/opt/homebrew/opt/senzing/runtime/data`, NOT `.../er/resources`.
