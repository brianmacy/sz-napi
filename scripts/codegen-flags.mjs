#!/usr/bin/env node
/**
 * Emits the `SzFlags` constant table for `@senzing/types` by serializing the
 * frozen `SzFlags` object that `@senzing/sdk` already builds from the native
 * binding -- the same object every native consumer sees.
 *
 * `@senzing/types` ships without the native module, so a tRPC-only consumer has
 * no way to reach the flag values at runtime. Generating them here — rather than
 * hand-maintaining a copy — keeps the native package and the types package from
 * drifting apart: the native `flag!` macro list stays the single source.
 *
 * Note this does NOT catch the #50 class of defect (the `flag!` list itself
 * diverging from upstream `sz_rust_sdk::flags::SzFlags`); the generator would
 * faithfully emit the same gap. That needs a separate check.
 *
 *   node scripts/codegen-flags.mjs            # write the file
 *   node scripts/codegen-flags.mjs --check    # exit 1 if it would change
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Paths are derived from the workspace layout, not hardcoded at call sites.
const BINDING_PKG = '@senzing/sdk';
const OUTPUT = path.join(repoRoot, 'packages', 'types', 'src', 'flags.generated.ts');

const require = createRequire(path.join(repoRoot, 'package.json'));

function loadFlags() {
  let binding;
  try {
    binding = require(BINDING_PKG);
  } catch (err) {
    throw new Error(
      `Could not load ${BINDING_PKG}. The native module must be built before ` +
        `generating flags (napi build). Original error: ${err.message}`,
    );
  }
  // Consume the built package's own frozen SzFlags -- the same object every
  // native consumer sees -- rather than re-deriving it from getAllFlags().
  const table = binding.SzFlags;
  if (!table || typeof table !== 'object') {
    throw new Error(`${BINDING_PKG} does not export SzFlags`);
  }
  const entries = Object.entries(table).map(([name, value]) => ({ name, value }));
  if (entries.length === 0) {
    throw new Error('SzFlags is empty');
  }
  for (const e of entries) {
    if (typeof e.value !== 'bigint') {
      throw new Error(`Flag ${e.name} is ${typeof e.value}, expected bigint`);
    }
  }
  // Sort by name so the output is stable regardless of macro ordering.
  return entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

function render(flags) {
  const body = flags.map((f) => `  ${f.name}: ${f.value.toString()}n,`).join('\n');
  return `// GENERATED FILE - do not edit.
// Serialized from @senzing/sdk's SzFlags; run \`npm run codegen:flags\`.
// CI regenerates this and fails on a diff.

/**
 * Senzing flag constants.
 *
 * Values are \`bigint\` because \`WITH_INFO\` occupies bit 62 (\`1n << 62n\`), which
 * exceeds \`Number.MAX_SAFE_INTEGER\`.
 *
 * These are the same values \`@senzing/sdk\` builds at runtime from the native
 * binding, exported here as plain data so a consumer without the native module
 * (for example a tRPC-only client) can still name its flags.
 */
export const SzFlags = Object.freeze({
${body}
});

/** Names of the available Senzing flags. */
export type SzFlagName = keyof typeof SzFlags;
`;
}

const flags = loadFlags();
const rendered = render(flags);
const checkOnly = process.argv.includes('--check');

let current = null;
try {
  current = readFileSync(OUTPUT, 'utf8');
} catch {
  /* not generated yet */
}

const rel = path.relative(repoRoot, OUTPUT);

if (checkOnly) {
  if (current !== rendered) {
    console.error(
      `${rel} is out of date (${flags.length} flags from the native binding).\n` +
        'Run `npm run codegen:flags` and commit the result.',
    );
    process.exit(1);
  }
  console.log(`${rel} is up to date (${flags.length} flags).`);
} else {
  if (current === rendered) {
    console.log(`${rel} unchanged (${flags.length} flags).`);
  } else {
    writeFileSync(OUTPUT, rendered);
    console.log(`Wrote ${rel} (${flags.length} flags).`);
  }
}
