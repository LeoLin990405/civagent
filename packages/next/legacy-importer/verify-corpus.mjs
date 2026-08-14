#!/usr/bin/env node
/**
 * verify-corpus.mjs — P0: immutability and coverage verification for the frozen
 * legacy-cc-v5 corpus.
 *
 * Re-hashes every file under corpus/ and compares against MANIFEST.json. Fails
 * (exit 1) on any missing file, extra file, digest mismatch, or malformed
 * manifest. Prints the coverage ledger summary on success.
 *
 * Usage:
 *   node packages/next/legacy-importer/verify-corpus.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORPUS_ROOT = path.join(__dirname, "corpus");
const MANIFEST_FILE = path.join(CORPUS_ROOT, "MANIFEST.json");

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
const failures = [];
const checked = { files: 0, bytes: 0 };

function verifyEntry(relDir, files) {
  for (const [name, digest] of Object.entries(files)) {
    const p = path.join(CORPUS_ROOT, relDir, name);
    if (!fs.existsSync(p)) {
      failures.push(`missing ${path.join(relDir, name)}`);
      continue;
    }
    const actual = sha256(p);
    checked.files++;
    checked.bytes += fs.statSync(p).size;
    if (actual !== digest) {
      failures.push(`digest mismatch ${path.join(relDir, name)}: expected ${digest}, got ${actual}`);
    }
  }
}

for (const t of manifest.traces) verifyEntry(path.join("traces", t.matchId), t.digests);
for (const t of manifest.tournaments) verifyEntry(path.join("tournaments", t.tournamentId), t.digests);

// extra-file check: every file under corpus must be declared in the manifest
function walk(dir, rel = "") {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const r = path.join(rel, f);
    if (fs.statSync(p).isDirectory()) walk(p, r);
    else if (r !== "MANIFEST.json") undeclared.push(r);
  }
}
const undeclared = [];
walk(CORPUS_ROOT);

const declared = new Set([
  "MANIFEST.json",
  ...manifest.traces.flatMap((t) => [`traces/${t.matchId}/meta.json`, `traces/${t.matchId}/events.jsonl`]),
  ...manifest.tournaments.flatMap((t) => t.files.map((f) => `tournaments/${t.tournamentId}/${f}`)),
]);
for (const u of undeclared) if (!declared.has(u)) failures.push(`undeclared file ${u}`);

if (failures.length) {
  console.error(`CORPUS VERIFY FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

const coverage = manifest.coverage;
const perProvider = Object.entries(coverage)
  .map(([b, c]) => `${b}: ${c.traces} traces (hist ${c.historical}/rand ${c.random}/abnormal ${c.abnormal}/mech ${c.mechanisms}/skill ${c.skillLifecycle}, tasks: ${c.tasks.join(",")})`)
  .join("\n  ");

console.log(`CORPUS VERIFY PASSED
  instrument:     ${manifest.instrument}
  legacy pin:     ${manifest.legacyBaselineCommit}
  harness pin:    ${manifest.harnessBaselineCommit}
  frozen at:      ${manifest.frozenAt}
  traces:         ${manifest.totals.traces} (>=100 required: ${manifest.totals.traces >= 100 ? "PASS" : "FAIL"})
  tournaments:    ${manifest.totals.tournaments}
  files checked:  ${checked.files}
  bytes checked:  ${checked.bytes}
  manifest digest:${sha256(MANIFEST_FILE)}
  per provider:
  ${perProvider}
  declared gaps:
${manifest.declaredGaps.map((g) => "  - " + g).join("\n")}`);
