#!/usr/bin/env node
/**
 * import-lint.mjs — P0/P1 dependency gate (plan §4.2).
 *
 * Rules enforced over packages/next/**:
 *   1. Only packages/next/harness-adapter may import @deepseek-ai/* or Cordis.
 *   2. Inside the adapter, imports must use package root or declared export
 *      subpaths (./surface, ./presentation, ./types, ./client, ./invariant,
 *      ./message, ./brand, ./package.json) — never internal source paths
 *      (no /src/, no /lib/ deep paths).
 *   3. Only pinned seam package names may be imported.
 *
 * Exit 1 on any violation. Usage: node .../import-lint.mjs [root]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEXT_ROOT = path.resolve(__dirname, "..");
const ALLOWED_SUBPATHS = ["", "/surface", "/presentation", "/types", "/client", "/invariant", "/message", "/brand", "/package.json"];
const SEAM_NAMES = new Set([
  "cordis", "dsh-llm", "dsh-llm-deepseek", "dsh-agent", "dsh-agent-loop",
  "dsh-session", "dsh-system-prompt", "dsh-tools", "dsh-credentials",
  "dsh-typert-protocol", "dsh-typert-registry", "dsh-client-connection",
]);

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    if (f === "node_modules") continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.(mjs|js)$/.test(f)) out.push(p);
  }
  return out;
}

/**
 * Run the import lint over packages/next. Returns
 * {ok, violations, importsChecked}.
 */
export function runImportLint(root = NEXT_ROOT) {
  const violations = [];
  let importsChecked = 0;
  const adapterDir = path.join(root, "harness-adapter");
  for (const file of walk(root)) {
    const rel = path.relative(root, file);
    const src = fs.readFileSync(file, "utf8");
    const re = /(?:from\s+|import\()\s*["'](@deepseek-ai\/[^"']+)["']/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      importsChecked++;
      const spec = m[1];
      const inAdapter = file.startsWith(adapterDir);
      if (!inAdapter) {
        violations.push(`${rel}: imports ${spec} outside harness-adapter (only the adapter may import Harness)`);
        continue;
      }
      const rest = spec.slice("@deepseek-ai/".length);
      const name = rest.split("/")[0];
      const subpath = rest.slice(name.length);
      if (!SEAM_NAMES.has(name)) violations.push(`${rel}: ${spec} — ${name} is not a pinned seam package`);
      if (!ALLOWED_SUBPATHS.includes(subpath)) {
        violations.push(`${rel}: ${spec} is not a package export subpath (allowed: ${ALLOWED_SUBPATHS.join(", ")})`);
      }
      if (/\/src\//.test(spec) || /\/lib\//.test(spec)) {
        violations.push(`${rel}: ${spec} reaches into internal source paths — exports only`);
      }
    }
  }
  return { ok: violations.length === 0, violations, importsChecked };
}

export function importLintSelfCheck() {
  return runImportLint();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = runImportLint(process.argv[2] ?? NEXT_ROOT);
  if (!result.ok) {
    console.error(`IMPORT LINT FAILED (${result.violations.length} violations, ${result.importsChecked} imports checked):`);
    for (const v of result.violations) console.error(`  - ${v}`);
    process.exit(1);
  }
  console.log(`IMPORT LINT PASSED (${result.importsChecked} @deepseek-ai imports checked; all inside harness-adapter, exports-only)`);
}
