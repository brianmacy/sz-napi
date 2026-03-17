## Build and Test Commands

### Rust build

```bash
cargo build --workspace
```

### NAPI build (generates .node + .d.ts + index.js)

```bash
cd packages/sdk && npx napi build --platform
cd packages/configtool && npx napi build --platform
```

Note: `napi build` overwrites `index.js` and `index.d.ts` — these are committed to the repo since they're required at runtime. The real entry points are `sdk.js` and `configtool.js`.

The SDK build.rs embeds the Senzing lib rpath in the .node binary, so `DYLD_LIBRARY_PATH` / `LD_LIBRARY_PATH` is NOT needed at runtime.

### Run SDK tests (requires Senzing runtime)

```bash
cd packages/sdk && npx vitest run
```

No `DYLD_LIBRARY_PATH` needed — the rpath is embedded in the .node binary at build time.

The test reads `SENZING_SETTINGS` env var for CI compatibility. Locally, it falls back to macOS Homebrew paths.

### Run configtool tests (no runtime needed)

```bash
cd packages/configtool && npx vitest run
```

### Run examples

Examples are self-contained projects in `examples/`:

```bash
cd examples/basic-sdk-usage && npm install && npm start
cd examples/config-management && npm install && npm start
cd examples/configtool-usage && npm install && npm start -- <config.json>
cd examples/electron-worker && npm install && npm start
```

SDK examples require a pre-initialized SQLite database (see senzing-paths.md).

### Clippy

```bash
cargo clippy --workspace --all-targets -- -D warnings
```

### Cargo fmt (workspace packages only)

```bash
cargo fmt -p senzing-sdk-napi -p senzing-configtool-napi --check
```

Note: Do NOT use `cargo fmt --all` — it formats sibling repo path dependencies too.

### CI

CI runs in GitHub Actions with:
- Cargo check (clippy + fmt) on Ubuntu
- Configtool build/test on 4 platforms (macOS, Linux x64, Linux arm64, Windows)
- SDK build/test on Amazon Linux 2023 containers (x64, arm64) with `yum install senzingsdk-runtime`
- Examples run in the SDK test job
