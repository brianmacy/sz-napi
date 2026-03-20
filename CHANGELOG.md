# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

[Unreleased]: https://github.com/brianmacy/sz-napi/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/brianmacy/sz-napi/releases/tag/v0.1.0
