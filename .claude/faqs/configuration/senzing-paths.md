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

### Rpath — no DYLD_LIBRARY_PATH needed

The SDK `build.rs` auto-detects the Senzing lib path and embeds it as an rpath in the `.node` binary at build time. It also adds rpath entries for OpenSSL and SQLite transitive dependencies. You do NOT need to set `DYLD_LIBRARY_PATH` or `LD_LIBRARY_PATH` to run tests or examples.

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
