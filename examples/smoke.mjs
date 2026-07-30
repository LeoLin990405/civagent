#!/usr/bin/env node
// smoke.mjs — zero-dependency end-to-end smoke for the topology pipeline.
//
// This script exists because the rest of civagent's user-facing commands
// (`civagent run`, `civagent tournament`) all require a live model backend
// (Claude Code or one of the cn-cc-* forks + an API key). Someone who has
// just cloned the repo cannot verify "does this thing work" from those.
//
// But civagent has one whole path that touches no model at all:
//
//   topology.json  →  validateRegimeTopology  →  computeMetrics  →
//                     generateBaseline (solo | flat | random)   →
//                     validate the generated control again.
//
// This is that path, exercised against examples/example-regime/. It runs in
// under a second, needs no network, no API key, and no external CLI. Its job
// is to fail loudly if any of those four steps regresses.
//
// Exit 0 iff every step passes. Non-zero on ANY failure (including a bad
// example, a schema regression, or a baseline that no longer validates).
//
// CI wires it as `npm run smoke`; the same command is meant to work for anyone
// who clones the repo and runs `npm ci && npm run smoke`.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateRegimeTopology } from "../engine/topology/validate.mjs";
import { computeMetrics } from "../engine/topology/metrics.mjs";
import { generateBaseline, BASELINE_TYPES } from "../engine/baseline.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXAMPLE_DIR = path.join(ROOT, "examples", "example-regime");

// Every step logs its own line; a failure prints "✗ FAIL" and the reason,
// then exits non-zero. Success prints "✓ smoke OK" at the very end and only
// then — a partial run that exits mid-way must not read as success.
function die(step, reason) {
  console.error(`✗ FAIL [${step}] ${reason}`);
  process.exit(1);
}
function ok(step, msg) {
  console.log(`✓ ${step}: ${msg}`);
}

// ── step 1: validate the example topology ─────────────────────────────────
const v1 = validateRegimeTopology(EXAMPLE_DIR);
if (!v1.ok) {
  die("validate:example", `example topology is invalid:\n  - ${v1.errors.join("\n  - ")}`);
}
ok("validate:example", `${v1.topology.regime} (${v1.topology.nodes.length} nodes, ${v1.topology.edges.length} edges, mode=${v1.topology.mode})`);

// ── step 2: compute metrics ───────────────────────────────────────────────
let metrics;
try {
  metrics = computeMetrics(v1.topology);
} catch (e) {
  die("metrics:example", `computeMetrics threw: ${e.message}`);
}
// Sanity: our 4-office checks-and-balances example must have exactly one
// review/veto cycle (proposer ↔ reviewer). If the metrics module changes and
// silently reports zero, the smoke would still pass without this guard.
if (metrics.checks_cycles < 1) {
  die("metrics:example", `expected ≥1 checks_cycle in example, got ${metrics.checks_cycles}`);
}
if (metrics.command_depth < 1) {
  die("metrics:example", `expected command_depth ≥ 1, got ${metrics.command_depth}`);
}
ok("metrics:example", `nodes=${metrics.nodes} edges=${metrics.edges} density=${metrics.density} depth=${metrics.command_depth} checks_cycles=${metrics.checks_cycles}`);

// ── step 3: generate a baseline control against the example ─────────────
// generateBaseline requires the source regime to live at
// `<projectRoot>/regimes/<region>/<id>/`. examples/example-regime does not
// match that shape (deliberately — it is NOT one of the 57). We stage a
// throwaway copy at that shape inside an OS temp dir and point projectRoot
// at the temp dir. Nothing under regimes/ in the real repo is touched.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-smoke-"));
try {
  const stagedRegimeDir = path.join(tmp, "regimes", "example", "regime");
  fs.mkdirSync(stagedRegimeDir, { recursive: true });
  for (const f of ["metadata.json", "IDENTITY.md", "SOUL.md", "topology.json"]) {
    fs.copyFileSync(path.join(EXAMPLE_DIR, f), path.join(stagedRegimeDir, f));
  }

  // "flat" is chosen because it lets us verify the whole shape without any
  // seeded randomness (a random baseline is also exercised by unit tests).
  // The generator writes its output somewhere under `tmp`, and we ALWAYS
  // re-validate it — a baseline that no longer validates is the exact class
  // of regression this smoke exists to catch.
  const BASELINE_TYPE = "flat";
  if (!BASELINE_TYPES.includes(BASELINE_TYPE)) {
    die("baseline:example", `internal: unknown baseline type "${BASELINE_TYPE}"`);
  }
  const destDir = path.join(tmp, "regimes", "example", "regime-flat");
  const r = generateBaseline("example/regime", BASELINE_TYPE, {
    projectRoot: tmp,
    destDir,
    seed: 42,
  });
  if (!r.validation || !r.validation.ok) {
    const errs = r.validation ? r.validation.errors : ["no validation result"];
    die("baseline:example", `generated baseline failed validation:\n  - ${errs.join("\n  - ")}`);
  }
  ok("baseline:example", `${BASELINE_TYPE} baseline written to ${path.relative(tmp, r.outDir)} (nodes=${r.metrics?.nodes}, edges=${r.metrics?.edges})`);

  // ── step 4: re-validate the baseline as a standalone regime dir ────────
  const v2 = validateRegimeTopology(destDir);
  if (!v2.ok) {
    die("validate:baseline", `baseline topology does not re-validate:\n  - ${v2.errors.join("\n  - ")}`);
  }
  ok("validate:baseline", `${v2.topology.regime} (${v2.topology.nodes.length} nodes, ${v2.topology.edges.length} edges, mode=${v2.topology.mode})`);
} finally {
  // Best-effort cleanup; smoke exit code is what matters, not tmp hygiene.
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
}

console.log("✓ smoke OK");
