# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.0] - 2026-09-15

### Added

- **`SzFlags` is now exported from `@senzing/types`**, so a consumer without the native module can name its flags instead of hand-writing `bigint` literals. The values are *generated* from the native binding (`npm run codegen:flags` → `packages/types/src/flags.generated.ts`), not hand-maintained: the `flag!` list in `packages/sdk/src/flags.rs` remains the single source, and CI regenerates the file in the `test-sdk` job (which has both the built `.node` and the Senzing runtime) and fails on a diff. A parity test asserts the committed table matches the binding exactly, so a misspelled flag is now a compile error rather than an `undefined` that silently becomes `0n`. Note this guards drift between the native package and the types package; it does **not** catch the #50 class, where the `flag!` list itself diverges from upstream `sz_rust_sdk::flags::SzFlags` — that needs a separate check, tracked separately. (#99)
- **`@senzing/types` and `@senzing/trpc` are now attached to the GitHub release as npm tarballs.** A Node.js client can consume the tRPC server with no Rust toolchain, no `libSz`, and no `SENZING_PATH` — `npm install ./senzing-types-0.9.0.tgz ./senzing-trpc-0.9.0.tgz` pulls 8 packages and reports 0 vulnerabilities. Because `@senzing/sdk` is an *optional* peer dependency of `@senzing/trpc`, the native package is not installed. The `release` job now sets up Node, runs `npm ci --ignore-scripts`, builds the two JS packages and `npm pack`s them into `release-assets/`, which the existing `files: release-assets/*` glob already publishes. (#99)

### Fixed

- **The DTS build was broken on TypeScript 6 — no `.d.ts` shipped.** `npm run build -w @senzing/types` exited 1 with `error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0`. The CJS/ESM output still succeeded, so `dist/index.js` was written while `dist/index.d.ts` was not, which made the failure easy to miss; `@senzing/trpc` then failed with `TS7016: Could not find a declaration file for module '@senzing/types'`. The `baseUrl` is injected by `tsup`'s DTS pass (`node_modules/tsup/dist/rollup.js`), not by any tsconfig in this repo, and the resolved TypeScript is 6.0.3. Setting `"ignoreDeprecations": "6.0"` in the root `tsconfig.json` restores declaration output: `types` emits `index.d.ts` (6.09 KB), `trpc` emits `index.d.ts` (21.09 KB), `client.d.ts`, and `router-*.d.ts`. This is a live TypeScript 7 migration warning, not a lint nit — the option stops functioning in TS 7, and `@senzing/electron` already resolves `typescript@7.0.2`. (#99)

### Changed

- **Package versions now match the release tag.** All five workspace packages sat at `0.1.0` while the repo was tagged `v0.8.1`, so a tarball renamed to match the tag still reported `0.1.0` in `npm ls` and in a consumer's `package-lock.json` — the filename and the manifest disagreed. All packages are now `0.9.0`. (#99)
- Consolidated dependency updates (supersedes #95, #96, #97, #98): `vitest` and `@vitest/coverage-v8` 4.1.10 → 4.1.11, `@napi-rs/cli` 3.8.5 → 3.10.0, `electron` 44.0.0 → 44.4.0, `zod` 4.4.3 → 4.6.5, `@types/node` 26.2.0 → 26.6.0, and `js-yaml` 4.3.1 → 5.4.2 transitively. This clears all four advisories that were failing the Security Audit workflow on `main`: `GHSA-2883-xcg3-v3hh` (js-yaml, high) and `GHSA-82fw-gwwq-j7x9` (`@vitest/mocker`, moderate, via `vitest` and `@vitest/coverage-v8`). `npm audit` now reports 0 vulnerabilities. Declared ranges in `package.json` are unchanged — the lockfile alone moved, and the `esbuild: 0.28.2` override is preserved.


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

[Unreleased]: https://github.com/brianmacy/sz-napi/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/brianmacy/sz-napi/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/brianmacy/sz-napi/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/brianmacy/sz-napi/compare/v0.1.0...v0.8.0
[0.1.0]: https://github.com/brianmacy/sz-napi/releases/tag/v0.1.0
