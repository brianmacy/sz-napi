## Senzing Installation Paths (macOS Homebrew)

### Install

```bash
brew tap senzing/senzingsdk https://github.com/Senzing/homebrew-senzingsdk
brew install --cask senzingsdk
```

### Paths

- **SENZING_BASE**: `/opt/homebrew/opt/senzing/er`
- **CONFIGPATH**: `/opt/homebrew/opt/senzing/er/resources/templates`
- **RESOURCEPATH**: `/opt/homebrew/opt/senzing/er/resources`
- **SUPPORTPATH**: `/opt/homebrew/opt/senzing/data` (NOT `resources/`!)
- **Lib path**: `/opt/homebrew/opt/senzing/er/lib` (embedded as rpath at build time)
- **Schema SQL**: `/opt/homebrew/opt/senzing/er/resources/schema/szcore-schema-sqlite-create.sql`

### SUPPORTPATH gotcha

The support/data path is `/opt/homebrew/opt/senzing/data`, NOT `.../er/resources`. Using `resources` causes: `Plugin initialization error LIBRARY[libg2ParseName.so] failed to initialize because [GNR data files failed to load]`.

### Rpath — covers the `.node`, NOT the Rust test binary

The SDK `build.rs` auto-detects the Senzing lib path and embeds it as an rpath in the
**`.node`** binary at build time. It also adds rpath entries for OpenSSL and SQLite
transitive dependencies. So running the TS tests, the examples, and any consumer that loads
the `.node` needs no `DYLD_LIBRARY_PATH` / `LD_LIBRARY_PATH` of its own.

**`cargo test` is the exception and it is not optional.** The cdylib test harness
(`target/debug/deps/senzing_sdk_napi-*`) is a *different* binary from the `.node` and carries
no such rpath, so a bare `cargo test` aborts:

```
dyld[39335]: Library not loaded: @rpath/libSz.dylib
  Referenced from: .../target/debug/deps/senzing_sdk_napi-f1623bec8ee0462d
error: test failed ... (signal: 6, SIGABRT: process abort signal)
```

`npm test` exports the path itself (see the `test` script in the root `package.json`);
`cargo` does not. Export it before any `cargo test`, `cargo run --example`, or
`npm run codegen:flags` / `codegen:flags:check`:

```bash
export DYLD_LIBRARY_PATH="/opt/homebrew/opt/senzing/er/lib:/opt/homebrew/opt/sqlite/lib:/opt/homebrew/opt/openssl@3/lib:$DYLD_LIBRARY_PATH"
```

With it exported, `cargo test` exits 0. Note the Rust crates currently carry **no** unit
tests (0 passed in both `senzing_sdk_napi` and `senzing_configtool_napi`) — the coverage is
all on the TypeScript side — so the abort is purely the harness failing to launch.

### Setup script

Source the provided setup script for shell use:

```bash
source "$(brew --prefix)/opt/senzing/er/setupEnv"
```

### SQLite database initialization

SQLite databases must be initialized with the Senzing schema BEFORE use:

```bash
sqlite3 /tmp/test.db < /opt/homebrew/opt/senzing/er/resources/schema/szcore-schema-sqlite-create.sql
```

Without this, you get: `unable to open database file` or `No engine configuration registered in datastore`.

### Linux paths (Amazon Linux / RHEL / Debian)

- **CONFIGPATH**: `/opt/senzing/er/resources/templates`
- **RESOURCEPATH**: `/opt/senzing/er/resources`
- **SUPPORTPATH**: `/opt/senzing/data`
- **Lib path**: `/opt/senzing/er/lib` (embedded as rpath at build time)

Install via: `yum install senzingsdk-runtime` (Amazon Linux/RHEL) or `apt install senzingsdk-runtime` (Debian/Ubuntu)
