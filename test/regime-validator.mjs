#!/usr/bin/env node
// Mechanical validation of all 57 regimes' metadata + required docs.
// Used by CI and `npm run validate:regimes`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGIMES = path.join(ROOT, "regimes");
// Canonical 6 modes. Historical aliases normalize to these.
const PATTERN_ALIASES = {
  "centralized-hierarchy": "centralized",
  "democratic-council": "democratic",
  "federated-autonomy": "federation",
  "dual-power": "dual-track",
};
const VALID_PATTERNS = new Set([
  "centralized", "checks-and-balances", "democratic",
  "dual-track", "federation", "theocratic",
  ...Object.keys(PATTERN_ALIASES),
]);

const errors = [];
const warnings = [];
let count = 0;

function check(cond, msg, level = "error") {
  if (!cond) (level === "error" ? errors : warnings).push(msg);
}

for (const region of fs.readdirSync(REGIMES)) {
  if (region.startsWith("_")) continue;
  const regionDir = path.join(REGIMES, region);
  if (!fs.statSync(regionDir).isDirectory()) continue;

  for (const id of fs.readdirSync(regionDir)) {
    const regimeDir = path.join(regionDir, id);
    if (!fs.statSync(regimeDir).isDirectory()) continue;
    count++;
    const tag = `${region}/${id}`;

    const metaPath = path.join(regimeDir, "metadata.json");
    check(fs.existsSync(metaPath), `${tag}: missing metadata.json`);
    if (!fs.existsSync(metaPath)) continue;

    let meta;
    try { meta = JSON.parse(fs.readFileSync(metaPath, "utf8")); }
    catch (e) { errors.push(`${tag}: metadata.json invalid JSON — ${e.message}`); continue; }

    check(meta.id === id, `${tag}: metadata.id mismatch (got ${meta.id})`);
    check(meta.name?.zh && meta.name?.en, `${tag}: name.zh and name.en required`);
    check(meta.era?.zh, `${tag}: era.zh required`);
    check(typeof meta.agentCount === "number", `${tag}: agentCount must be number`);
    check(Array.isArray(meta.tags), `${tag}: tags must be array`);
    check(VALID_PATTERNS.has(meta.orchestrationPattern),
      `${tag}: orchestrationPattern "${meta.orchestrationPattern}" not recognized (canonical or alias)`);
    if (PATTERN_ALIASES[meta.orchestrationPattern]) {
      warnings.push(`${tag}: pattern "${meta.orchestrationPattern}" is an alias of "${PATTERN_ALIASES[meta.orchestrationPattern]}" — consider normalizing`);
    }

    for (const f of ["IDENTITY.md", "SOUL.md"]) {
      check(fs.existsSync(path.join(regimeDir, f)),
        `${tag}: missing ${f}`, "warning");
    }
  }
}

console.log(`Validated ${count} regimes.`);
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} warnings:`);
  for (const w of warnings) console.log(`  ${w}`);
}
if (errors.length) {
  console.error(`\n✗ ${errors.length} errors:`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log("✓ all regimes pass mechanical validation");
