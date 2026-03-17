## Two-Package Design

### @senzing/sdk

Requires the Senzing runtime (`libSz.dylib`/`.so`/`.dll`). Provides SzEnvironment, SzEngine, SzConfigManager, SzDiagnostic, SzProduct.

### @senzing/configtool

Pure JSON manipulation — NO Senzing runtime needed. Provides 157+ stateless functions for editing Senzing configuration JSON documents.

### SzConfig was removed

The Rust SDK's `SzConfig` trait (with `export()`, `registerDataSource()`, etc.) is NOT exposed in the Node SDK. Instead:

1. `SzConfigManager.createConfig()` returns the config JSON string directly (calls `create_config().export()` internally)
2. Use `@senzing/configtool` functions to modify the config JSON
3. `SzConfigManager.registerConfig(modifiedJson)` to register it

### Config workflow

```javascript
const configMgr = env.getConfigManager();
let config = configMgr.createConfig(); // template JSON
config = configtool.addDataSource(config, { code: "DS" }); // modify with configtool
const id = configMgr.registerConfig(config, "comment"); // register
configMgr.setDefaultConfigId(id); // activate
env.reinitialize(id); // reload engine
```
