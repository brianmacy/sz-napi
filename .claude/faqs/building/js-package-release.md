## Shipping the pure-JS packages as release tarballs

### What is attached to a release

The `release` job in `.github/workflows/release.yml` packs `@senzing/types` and
`@senzing/trpc` into `release-assets/`, which the existing `files: release-assets/*` glob on
`softprops/action-gh-release` publishes alongside the native artifacts.

```yaml
- name: Build and pack the JS packages
  run: |
    npm ci --ignore-scripts
    npm run build -w @senzing/types -w @senzing/trpc
    npm pack -w @senzing/types -w @senzing/trpc \
      --pack-destination release-assets
```

### Why `--ignore-scripts` is required, not optional

That job runs on plain `ubuntu-latest` with **no Senzing runtime and no Rust toolchain**.
A normal `npm ci` would fire the native packages' install scripts and fail. The two JS
packages are pure TypeScript and need neither.

`@senzing/types` must build before `@senzing/trpc`, which imports it — hence the explicit
`-w @senzing/types -w @senzing/trpc` ordering.

### Why a consumer gets no native module

`@senzing/sdk` is an **optional peer dependency** of `@senzing/trpc`. Installing the two
tarballs into an empty project pulls 8 packages and leaves `node_modules/@senzing/`
containing `trpc` and `types` only — no `libSz`, no `SENZING_PATH`, no Rust.

```bash
npm install ./senzing-types-0.9.0.tgz ./senzing-trpc-0.9.0.tgz
```

### Package versions must match the release tag

All five workspace packages previously sat at `0.1.0` while the repo was tagged `v0.8.1`, so
a tarball renamed to match the tag still reported `0.1.0` in `npm ls` and in a consumer's
lockfile — filename and manifest disagreed. Keep all five workspace `package.json` versions
in step with the release tag when cutting a release.

### DTS output is load-bearing here

`tsup`'s DTS pass injects `baseUrl`, which TypeScript 6 reports as `TS5101: Option 'baseUrl'
is deprecated`. That failure kills **only** the declaration pass — CJS/ESM output still
succeeds — so `dist/index.js` gets written while `dist/index.d.ts` does not, and a tarball
ships with no types at all. The root `tsconfig.json` sets `"ignoreDeprecations": "6.0"` to
keep declarations emitting. This is a live TypeScript 7 migration warning, not a lint nit:
the option stops functioning in TS 7 and `@senzing/electron` already resolves
`typescript@7.0.2`. If a tarball ever ships without `.d.ts`, check this first.
