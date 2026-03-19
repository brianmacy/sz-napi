## Code Snippets

### What are code snippets?

The `code-snippets/` directory contains 27 focused, runnable TypeScript examples covering every SDK operation category. Each snippet is a standalone `index.ts` file runnable via `npx tsx`.

### How to run code snippets

```bash
cd code-snippets
npm install
npx tsx information/get-version/index.ts
```

Configtool snippets (no runtime needed) require a config JSON file argument:
```bash
npx tsx configtool/basic-usage/index.ts <path-to-config.json>
```

### Snippet categories

- `information/` — Version, license, performance benchmarks
- `initialization/` — Environment lifecycle, engine priming, purge
- `configuration/` — Config creation, data source registration
- `loading/` — Single records, batch with info, worker pools
- `searching/` — Attribute search, why analysis, worker pools
- `deleting/` — Single delete, batch deletion
- `redo/` — Continuous processing, worker pools, with info
- `error-handling/` — Error inspection, retry with backoff
- `stewardship/` — Force resolve, force unresolve
- `configtool/` — Offline editing, batch scripts (no runtime)

### Shared utility

All SDK snippets use `_utils/snippet-utils.ts` which provides `initSnippetEnvironment(name, dataSources?)`. This handles platform detection, SQLite database creation, SzEnvironment initialization, config bootstrap, and cleanup.

```typescript
import { initSnippetEnvironment } from "../../_utils/snippet-utils.ts";

const { env, cleanup } = initSnippetEnvironment("my-snippet", ["CUSTOMERS"]);
try {
  const engine = env.getEngine();
  // ... demo code
} finally {
  cleanup();
}
```

### How to add a new snippet

1. Create `code-snippets/<category>/<name>/index.ts`
2. Use `initSnippetEnvironment()` for boilerplate (or set up manually for init demos)
3. Always use `try/finally` with `cleanup()`
4. Add the snippet to CI in `.github/workflows/ci.yml` (test-sdk or test-configtool job)
5. Update `docs/guides/code-snippets.md` and `code-snippets/README.md`

### CI testing

Code snippets are tested in CI:
- **test-configtool job**: Runs configtool snippets on all platforms
- **test-sdk job**: Runs all SDK snippets (22 single-process) on Linux x64

Worker-pool snippets (load-worker-pool, search-worker-pool, redo-worker-pool) are not tested in CI due to the SzEnvironment singleton constraint in containers.
