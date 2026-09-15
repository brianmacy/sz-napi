## Generated SzFlags table (`scripts/codegen-flags.mjs`)

### Why it exists

`SzFlags` values live **only** inside the compiled native binding. `packages/sdk/src/flags.rs`
references upstream `sz_rust_sdk` constants rather than defining literals, so there is no
source file anywhere in this repo that contains the numbers.

`@senzing/types` ships without the native module. A tRPC-only or tarball-only consumer
therefore had no way to reach the flag values at runtime and had to hand-write `bigint`
literals. The table is now **generated** from the binding instead of hand-copied, so the
`flag!` macro list in `packages/sdk/src/flags.rs` stays the single source of truth and there
is no third list to drift.

### Commands

```bash
npm run codegen:flags         # regenerate packages/types/src/flags.generated.ts
npm run codegen:flags:check   # exit 1 if the committed file would change
```

Both shell out to `scripts/codegen-flags.mjs` (the repo's first top-level `scripts/`
directory). The generator `require()`s `@senzing/sdk` and serializes the frozen `SzFlags`
object the package already builds — it does not re-derive values from `getAllFlags()`.
Entries are sorted by name so output is stable regardless of macro ordering, and every
value is asserted to be a `bigint` before writing.

**The native module must be built first** (`napi build`). Without it the generator fails
with `Could not load @senzing/sdk`. On macOS the Senzing runtime must also be resolvable;
`npm test` exports `DYLD_LIBRARY_PATH` itself, but a bare `cargo test` / codegen run does
not — see senzing-paths.md.

### Where it is enforced

- **CI**: the `test-sdk` job (`.github/workflows/ci.yml`, step "Check generated SzFlags is
  up to date") runs `npm run codegen:flags:check`. That job is the right home because it is
  the only one with both the built `.node` and the Senzing runtime.
- **Tests**: `packages/sdk/__tests__/sdk.test.ts` has a parity block asserting the committed
  table matches the binding key-for-key and value-for-value.

`packages/types/src/flags.generated.ts` carries a `GENERATED FILE - do not edit` header.
Edit `flags.rs` and regenerate; never patch the generated file by hand.

### Consumer-visible surface

`@senzing/types` exports `SzFlags` (value) and `SzFlagName` (type) from `src/index.ts`.
Identical values are available from `@senzing/sdk`, which builds them at runtime from the
binding. A misspelled flag is now a compile error rather than an `undefined` that silently
coerces to `0n`.

### What this does NOT catch

This guards drift between the **native package and the types package**. It does not catch
the #50 class of defect, where the `flag!` list itself diverges from upstream
`sz_rust_sdk::flags::SzFlags` — the generator would faithfully emit the same gap. That is a
separate check, tracked in issue #101.
