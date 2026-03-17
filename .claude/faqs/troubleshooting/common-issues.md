## Common Issues

### "Cannot find native binding"

The `.node` file can't load `libSz.dylib`. Since the rpath is now embedded at build time, this usually means you need to rebuild:

```bash
cd packages/sdk && npx napi build --platform
```

The build.rs auto-detects the Senzing lib path (Homebrew on macOS, `/opt/senzing/er/lib` on Linux) and embeds it as an rpath. No `DYLD_LIBRARY_PATH` or `LD_LIBRARY_PATH` needed.

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

### macOS SIP and DYLD_LIBRARY_PATH

macOS System Integrity Protection strips `DYLD_LIBRARY_PATH` from child processes. This is no longer an issue — the SDK build.rs embeds the Senzing lib rpath directly in the .node binary at build time.

If you still see library loading errors, rebuild the SDK native module (`npx napi build --platform`).

### napi build overwrites index.js

This is expected. The `index.js` is the auto-generated platform loader. The real entry points are `sdk.js` and `configtool.js` (set in `package.json` `"main"`). Both `index.js` and `index.d.ts` are committed to the repo.

### Plugin initialization error / GNR data files failed to load

Wrong SUPPORTPATH. Use `/opt/homebrew/opt/senzing/runtime/data`, NOT `.../er/resources`.

### Worker thread: "Cannot read properties of undefined (reading 'WITH_INFO')"

When using `import("@senzing/sdk")` in a worker thread (ESM context), the CJS module exports are under `.default`:

```typescript
const sdkModule = await import("@senzing/sdk");
const sdk = (sdkModule as any).default ?? sdkModule;
const { SzEnvironment, SzFlags } = sdk;
```

### cargo fmt formats sibling repos

Use `-p` flag to scope to workspace packages only:

```bash
cargo fmt -p senzing-sdk-napi -p senzing-configtool-napi --check
```

Do NOT use `cargo fmt --all` — it traverses path dependencies into sibling repos.
