# Contributing to sz-napi

## Prerequisites

- **Rust**: Edition 2024, MSRV 1.88. Install via [rustup](https://rustup.rs/).
- **Node.js**: 18 or later.
- **Senzing runtime**: Required for `packages/sdk` tests only. Not needed for `packages/configtool`.

## Repository Layout

This is a monorepo with two packages:

```
sz-napi/
  packages/
    sdk/          # Node.js bindings for the Senzing entity resolution SDK
    configtool/   # Node.js bindings for the Senzing config tool
```

The packages depend on sibling Rust crates that must be checked out at the **same parent directory level** as `sz-napi`:

```
parent/
  sz-napi/
  sz-rust-sdk/
  sz-rust-sdk-configtool/
```

## Building

Build all Rust crates:

```sh
cargo build --workspace
```

Build the SDK native module:

```sh
cd packages/sdk && npx napi build --platform
```

Build the configtool native module:

```sh
cd packages/configtool && npx napi build --platform
```

## Testing

Run all tests:

```sh
npm test
```

Run configtool tests only (no Senzing runtime required):

```sh
cd packages/configtool && npx vitest run
```

Run SDK tests only (requires Senzing runtime and `DYLD_LIBRARY_PATH` on macOS or `LD_LIBRARY_PATH` on Linux pointing to the Senzing libraries):

```sh
cd packages/sdk && npx vitest run
```

## Pull Request Process

1. Fork the repository and create a branch from `main`.
2. Make your changes.
3. Ensure all tests pass.
4. Submit a pull request against `main` with a clear description of the change.

## Code Style

- **Rust**: Format with `cargo fmt` and ensure `cargo clippy --workspace --all-targets -- -D warnings` passes with no warnings.
- **TypeScript**: Follow the existing conventions in the project.

## Distribution

Packages are **not published to npm**. Distribution is via GitHub releases as prebuilt `.node` artifacts for each supported platform (macOS arm64, Linux x64, Linux arm64, Windows x64).
