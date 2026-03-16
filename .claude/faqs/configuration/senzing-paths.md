## Senzing Installation Paths (macOS Homebrew)

### Install
```bash
brew install senzingsdk-runtime-unofficial
```

### Paths
- **SENZING_BASE**: `/opt/homebrew/opt/senzing/runtime/er`
- **CONFIGPATH**: `/opt/homebrew/opt/senzing/runtime/er/resources/templates`
- **RESOURCEPATH**: `/opt/homebrew/opt/senzing/runtime/er/resources`
- **SUPPORTPATH**: `/opt/homebrew/opt/senzing/runtime/data` (NOT `resources/`!)
- **DYLD_LIBRARY_PATH**: `/opt/homebrew/opt/senzing/runtime/er/lib`
- **Schema SQL**: `/opt/homebrew/opt/senzing/runtime/er/resources/schema/szcore-schema-sqlite-create.sql`

### SUPPORTPATH gotcha
The support/data path is `/opt/homebrew/opt/senzing/runtime/data`, NOT `.../er/resources`. Using `resources` causes: `Plugin initialization error LIBRARY[libg2ParseName.so] failed to initialize because [GNR data files failed to load]`.

### SQLite database initialization
SQLite databases must be initialized with the Senzing schema BEFORE use:
```bash
sqlite3 /tmp/test.db < /opt/homebrew/opt/senzing/runtime/er/resources/schema/szcore-schema-sqlite-create.sql
```
Without this, you get: `unable to open database file` or `No engine configuration registered in datastore`.
