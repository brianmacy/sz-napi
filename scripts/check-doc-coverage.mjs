#!/usr/bin/env node
// Fails when any exported function in the TypeDoc entry points has no
// description (#120). Converts the project exactly as `npm run docs` does
// (typedoc.json), then requires a non-empty summary on every function
// signature, so a new undocumented #[napi] export cannot ship signature-only
// API pages. Usage: node scripts/check-doc-coverage.mjs
import { Application, ReflectionKind } from 'typedoc';

const app = await Application.bootstrap({ emit: 'none' });
const project = await app.convert();
if (!project) {
  console.error('TypeDoc conversion failed');
  process.exit(1);
}

const isDocumented = (fn) =>
  (fn.comment?.summary.length ?? 0) > 0 ||
  (fn.signatures ?? []).some((sig) => (sig.comment?.summary.length ?? 0) > 0);

const functions = project.getReflectionsByKind(ReflectionKind.Function);
const missing = functions.filter((fn) => !isDocumented(fn));

for (const fn of missing) {
  const source = fn.sources?.[0];
  const where = source ? ` (${source.fileName}:${source.line})` : '';
  console.error(`undocumented: ${fn.getFullName()}${where}`);
}
console.log(`${functions.length} functions, ${missing.length} undocumented`);
process.exit(missing.length === 0 ? 0 : 1);
