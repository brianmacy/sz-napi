# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.1] - 2026-08-26

### Fixed

- **Windows release build.** The `v0.8.0` tag's release failed while generating import libraries: the step ran `scoop prefix senzingsdk`, but `scoop` is not on `PATH` in that step — the install step's `$env:PATH` change does not persist across steps. Now the Senzing lib path is resolved once during scoop install (where `scoop` is on `PATH`) and exported via `$GITHUB_ENV` for the import-library and napi-build steps. `v0.8.1` is the first successful release of the 0.8 line.

## [0.8.0] - 2026-08-26

### Changed

- **BREAKING:** JSON-returning SDK methods now resolve the **raw JSON string** across all transports (native adapter, tRPC, Electron), instead of a parsed object. This matches the long-declared `@senzing/types` contract and the return type of every Senzing V4 binding (Rust `JsonString`, Java/C#/Python strings, and sz-napi's own native surface). Previously the transports `JSON.parse`d and resolved objects while the interfaces still declared `Promise<string>` — an incoherent contradiction. **Consumers that relied on parsed objects must now `JSON.parse(...)` at the call site.** Read-shaped results are typed `Promise<JsonString>` (a zero-cost `string` alias); opaque round-trip values (`getRedoRecord`, `createConfig`/`createConfigFromId`/`createConfigFromDefinition`) stay `Promise<string>`; `exportCsvEntityReport` stays `Promise<string>` (CSV, not JSON). Returning the raw string also preserves exact entity IDs above 2^53 that a naive `JSON.parse` would silently round. (#89)
- **BREAKING:** Renamed `SzEngine.closeExport()` → `closeExportReport()` to match the underlying C ABI (`Sz_closeExportReport`) and every other Senzing V4 SDK (Python `close_export_report`, Java `closeExportReport`, C# `CloseExportReport`, Rust `close_export_report`). (#49)
- Migrated the Senzing runtime install from the deprecated unofficial Homebrew cask (`brianmacy/senzingsdk-runtime-unofficial`) and Scoop bucket to the **official** `senzing/senzingsdk/senzingsdk` cask and `Senzing/scoop-senzingsdk` bucket, across the release workflow, README, guides, and examples. The deprecated macOS cask now hard-errors, which was breaking the release build.
- Redo code snippets: replaced `while(true) { countRedoRecords(); getRedoRecord(); }` pattern with idiomatic `for (let redo = engine.getRedoRecord(); redo; redo = engine.getRedoRecord())` loop, matching official Java/C#/Python/Rust SDK patterns

### Fixed

- **tRPC routers no longer `JSON.parse` unconditionally.** `addRecord` / `deleteRecord` / `reevaluateRecord` / `reevaluateEntity` without `WITH_INFO` (and `getRedoRecord` on an empty queue) return `""`, which `JSON.parse("")` threw `SyntaxError: Unexpected end of JSON input` on over tRPC. The native adapter guarded this; the routers did not. Returning the raw string removes the crash. (#89)
- **`SzEngine.exportJsonEntityReport` / `exportCsvEntityReport` type collision.** The native binding returned a numeric export handle, so the generated `index.d.ts` typed these methods as `(): number`, while the ergonomic `sdk.d.ts` layer augmented the same class to return an `SzExportIterator`. The same method name carried two different return types across the shipped type surface (native re-export said `number`; `env.getEngine()` usage resolved to `SzExportIterator`), which was internally inconsistent and broke consumers that type-check with `skipLibCheck: false`. The native handle methods are now exposed as `exportJsonEntityReportHandle` / `exportCsvEntityReportHandle` (via `#[napi(js_name = …)]`), and the public `exportJsonEntityReport` / `exportCsvEntityReport` (returning `SzExportIterator`) are defined solely by the `sdk.js` wrapper — so there is exactly one public declaration per name. (#53)

### Added

- `JsonString` type alias in `@senzing/types` documenting the JSON-string return contract at every call site (a `string` alias today; the seam for a future typed-returns effort, `JsonString<T>`, without breaking consumers). (#89)
- CI type-check gate (`build:check` across workspaces, now including `@senzing/types` `__tests__`) that fails the build on interface/implementation drift — the class of defect vitest and tsx miss because they transpile without type-checking. (#89)
- Interactive entity graph visualization example with D3.js force-directed layout (`examples/entity-graph`)
- Production documentation: getting-started, error-handling, config-management, and deployment guides
- TypeDoc configuration for API reference generation (`typedoc.json`, `docs.yml` workflow)
- Runnable examples with `package.json` and `tsconfig.json` for basic-sdk-usage, config-management, configtool-usage, and worker-threads
- GitHub templates: issue templates (bug report, feature request), pull request template, CODEOWNERS, dependabot.yml
- CONTRIBUTING.md and SECURITY.md
- `release.yml` workflow for automated publishing
- ESM support with dual CJS/ESM exports for @senzing/sdk (`sdk.mjs`) and @senzing/configtool (`configtool.mjs`)
- Proper `configtool.d.ts` TypeScript types including `SzConfigError`
- Electron desktop app example (`examples/electron-app`)
- 27 runnable code snippets covering every SDK operation category: information, initialization, configuration, loading, searching, deleting, redo, error-handling, stewardship, and configtool (`code-snippets/`)
- Shared snippet utility for environment setup and cleanup (`code-snippets/_utils/snippet-utils.ts`)
- Code snippets documentation page (`docs/guides/code-snippets.md`)

- TypeDoc `projectDocuments` integration with landing page (`docs/index.md`) and `@example` tags linking to code snippets
- `configtool-docs.d.ts` documentation-only type declarations for TypeDoc configtool coverage

### Changed

- Guide documentation restructured from `docs/*.md` to `docs/guides/*.md`

- CI: SDK build and test jobs run in Amazon Linux 2023 containers with `yum install senzingsdk-runtime`
- CI: configtool-usage example runs in configtool test job on all platforms
- CI: basic-sdk-usage, config-management, configtool-usage examples run in SDK test job
- CI: code-snippets executed in both test-configtool (configtool snippets) and test-sdk (all SDK snippets) jobs
- CI: `release.yml` builds all platforms and attaches `.node` artifacts to GitHub Releases
- CI: `cargo fmt` scoped to workspace packages only (`-p` flag) to avoid formatting sibling repos
- Extracted `json_serialize_error` helper to reduce error-handling boilerplate in configtool Rust sources
- Rust modernization: removed `extern crate`, use `is_none_or`, `Vec::with_capacity(80)` for flags
- Removed blanket `#![allow(dead_code)]` from SDK crate (targeted `#[allow]` on FFI items only)
- Improved `SzExportIterator` TypeScript type declarations with module augmentation
- SDK tests read `SENZING_SETTINGS` env var for CI compatibility, fall back to macOS paths locally
- Committed NAPI-RS generated `index.js` and `index.d.ts` (required at runtime)
- Added `expect.assertions()` guards to error tests preventing silent pass on non-throwing code
- Renamed `examples/electron-worker` to `examples/worker-threads`
- basic-sdk-usage now uses `SzExportIterator` `for...of` pattern

### Fixed

- config-management example `getEngine()` before config registration
- configtool-usage usage message (`ts-node` to `tsx`)

### Removed

- Stale `DYLD_LIBRARY_PATH`/`LD_LIBRARY_PATH` references from examples and docs

## [0.1.0] - 2026-03-16

### Added

#### @senzing/sdk

- `SzEnvironment` lifecycle management for initializing and destroying the Senzing engine
- `SzEngine` with full entity resolution operations:
  - `addRecord` / `deleteRecord` for record ingestion and removal
  - `getEntityById` for entity retrieval by entity ID
  - `searchByAttributes` for attribute-based entity search
  - `whyEntities` for entity resolution explanation
  - Export iteration for bulk entity export
  - Additional engine methods covering the full Senzing v4 API surface
- `SzConfigManager` for configuration lifecycle management including config creation, registration, and activation
- `SzDiagnostic` for engine diagnostic operations
- `SzProduct` for product version and license information
- `SzFlags` as `bigint` values with `WITH_INFO` at bit 62 and full flag set for all API operations
- Structured error hierarchy rooted at `SzError` with typed subclasses:
  - `SzBadInputError` for invalid input conditions
  - `SzRetryableError` for transient failures
  - Additional domain-specific error types mapped from Senzing engine error codes
- Full TypeScript type definitions generated from Rust source via NAPI-RS
- Prebuilt native binaries for:
  - macOS arm64
  - Linux x64
  - Linux arm64
  - Windows x64
- Thread safety via NAPI-RS libuv scheduling, enabling safe concurrent use from JavaScript worker threads

#### @senzing/configtool

- Stateless pure-JavaScript/TypeScript JSON config editing with no runtime engine dependency
- Data source management (add, remove, list)
- Attribute management (add, remove, list)
- Feature management (add, remove, list)
- Element management (add, remove, list)
- Resolution rule management (add, remove, list)
- Fragment management (add, remove, list)
- Function management (add, remove, list)
- Comparison and distinct function call management
- Threshold configuration
- Behavior override management
- Generic threshold plan management
- System parameter management
- Raw config section access
- Config versioning support
- Script processing support

[Unreleased]: https://github.com/brianmacy/sz-napi/compare/v0.8.1...HEAD
[0.8.1]: https://github.com/brianmacy/sz-napi/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/brianmacy/sz-napi/compare/v0.1.0...v0.8.0
[0.1.0]: https://github.com/brianmacy/sz-napi/releases/tag/v0.1.0
