## typedoc + minimatch 11 postinstall patch

### Why it exists

GHSA-g3hv-75wg-m249 (minimatch) is fixed only in minimatch 11. `package.json` forces it with `overrides.typedoc.minimatch`, but typedoc 0.28.x still calls `Minimatch#matchOne()`, which minimatch 11 made private (upstream commit 5e4bb5bc). An override alone crashes the docs build with `mini.matchOne is not a function`.

### The fix

`scripts/patch-typedoc.mjs` runs at `postinstall` and rewrites typedoc's `glob()` in `node_modules/typedoc/dist/node-utils.js` so that it:

- builds `partialMini = new Minimatch(pattern, { partial: true, flipNegate: true })`;
- prunes directories with `partialMini.match(childPath.join("/"))`.

`partial` is minimatch 11's documented replacement for `matchOne(..., partial=true)`. `flipNegate` keeps the old behaviour of ignoring a leading `!`.

The script exits 0 when typedoc is absent (a production install) or already patched. It **fails the install** if typedoc's code no longer matches, so a typedoc bump cannot silently drop the patch.

### Rejected

- **Suppressing the alert:** a last resort, not used.
- **Pinning typedoc older:** older typedoc still pulls vulnerable minimatch.

### Removing it

Upstream: TypeStrong/typedoc#3150 and #3151 (the partial + flipNegate approach was suggested there). Once a typedoc release supports minimatch 11, delete the script, the `postinstall` entry and the override. The docs workflow must use the locked typedoc (`npm ci`), not a fresh `npx typedoc`.
