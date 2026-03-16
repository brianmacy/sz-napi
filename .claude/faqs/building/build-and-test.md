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
Note: `napi build` overwrites `index.js` — this is expected. The real entry points are `sdk.js` and `configtool.js`.

### Run SDK tests (requires Senzing runtime)
```bash
cd packages/sdk
DYLD_LIBRARY_PATH=/opt/homebrew/opt/senzing/runtime/er/lib npx vitest run
```
The `vitest.config.ts` also sets `DYLD_LIBRARY_PATH` in `test.env` but the parent process still needs it.

### Run configtool tests (no runtime needed)
```bash
cd packages/configtool && npx vitest run
```

### Clippy
```bash
cargo clippy --workspace --all-targets --all-features -- -D warnings
```
