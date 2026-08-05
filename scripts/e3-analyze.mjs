#!/usr/bin/env node
// e3-analyze.mjs — score the E3 run against docs/experiments/E3-preregistration.md.
//
// Reads only completed tournament manifests and per-match meta files; computes
// nothing that the pre-registration did not name in advance. Run:
//
//   node scripts/e3-analyze.mjs [--json]
//
// D2's threshold. The registration says "that backend's own judge position
// effect (biasReport.positionEffect.maxAbsDelta)". That field exists per
// tournament, not per backend, so the primary reading here is per-tournament:
// each pair is judged against the position effect of the tournament it came
// from. The stricter pooled-per-backend reading is reported alongside as a
// sensitivity check, because the sentence admits both and the choice must not
// be made after seeing which one is kinder.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const ROOT = path.join(os.homedir(), ".civagent");
const BACKENDS = ["doubao", "glm", "minimax", "qwen"];
const SCENARIOS = ["plague-response-01", "regional-militarization-01", "border-city-autonomy-01"];
const PAIRS = [
  ["china/qin", "_baseline/qin-random"],
  ["china/tang", "_baseline/tang-random"],
  ["china/ming", "_baseline/ming-random"],
  ["china/zhou", "_baseline/zhou-random"],
  ["global/athens", "_baseline/athens-random"],
];

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

/** Every pair in one tournament, with its D3 eligibility and raw gap. */
function readTournament(tag, scenario, rep) {
  const id = `e3-cn-${tag}-${scenario}-r${String(rep).padStart(2, "0")}`;
  const manifestPath = path.join(ROOT, "tournaments", id, "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  const m = readJson(manifestPath);

  const score = new Map((m.judge?.scores ?? []).map((s) => [s.regime, s.score]));
  const civ = new Map((m.civs ?? []).map((c) => [c.regime, c]));
  const noise = m.judge?.biasReport?.positionEffect?.maxAbsDelta ?? null;

  const armOk = (regime) => {
    const c = civ.get(regime);
    if (!c) return { ok: false, why: "arm missing from manifest" };
    if (c.dispatchEnforcement?.status !== "enforcement_passed")
      return { ok: false, why: `enforcement ${c.dispatchEnforcement?.status ?? "absent"}` };
    if (c.topologyParticipation?.status !== "participation_observed")
      return { ok: false, why: `participation ${c.topologyParticipation?.status ?? "absent"}` };
    return { ok: true, why: null };
  };

  const pairs = PAIRS.map(([src, ctl]) => {
    const a = armOk(src), b = armOk(ctl);
    const sSrc = score.get(src), sCtl = score.get(ctl);
    return {
      id, tag, scenario, rep, source: src, control: ctl,
      sourceScore: sSrc ?? null, controlScore: sCtl ?? null,
      delta: sSrc != null && sCtl != null ? +(sSrc - sCtl).toFixed(3) : null,
      noise,
      included: a.ok && b.ok && sSrc != null && sCtl != null,
      excludedWhy: a.ok ? (b.ok ? null : `control: ${b.why}`) : `source: ${a.why}`,
    };
  });
  return { id, noise, pairs, civs: m.civs ?? [] };
}

/** D4 reads the match meta, because tournament.mjs drops planDiff from the manifest. */
function readPlanDiff(tournamentId, regime) {
  const p = path.join(ROOT, "matches", `${tournamentId}__${regime.replace("/", "-")}`, "meta.json");
  if (!fs.existsSync(p)) return null;
  return readJson(p).planDiff ?? null;
}

const strata = [];
for (const tag of BACKENDS) {
  const tournaments = [];
  for (const scenario of SCENARIOS)
    for (let rep = 1; rep <= 5; rep++) {
      const t = readTournament(tag, scenario, rep);
      if (t) tournaments.push(t);
    }
  const pairs = tournaments.flatMap((t) => t.pairs);
  const pooledNoise = Math.max(...tournaments.map((t) => t.noise ?? 0));

  const verdict = (pr, threshold) => {
    if (!pr.included) return "excluded";
    if (threshold == null) return "unresolved";
    if (Math.abs(pr.delta) <= threshold) return "unresolved";
    return pr.delta > 0 ? "source" : "control";
  };
  for (const pr of pairs) {
    pr.verdict = verdict(pr, pr.noise);
    pr.verdictPooled = verdict(pr, pooledNoise);
  }

  const tally = (key) => {
    const c = { source: 0, control: 0, unresolved: 0, excluded: 0 };
    for (const pr of pairs) c[pr[key]]++;
    return c;
  };
  const d1 = tally("verdict"), d1p = tally("verdictPooled");

  // D3, per arm rather than per pair.
  const arms = tournaments.flatMap((t) => t.civs);
  const d3 = {
    total: arms.length,
    enforcementFailed: arms.filter((c) => c.dispatchEnforcement?.status !== "enforcement_passed").length,
    participationAbsent: arms.filter((c) => c.topologyParticipation?.status !== "participation_observed").length,
  };

  // D4, source arms only — a scrambled control has no historical topology to deviate from.
  const d4rows = [];
  for (const t of tournaments)
    for (const [src] of PAIRS) {
      const pd = readPlanDiff(t.id, src);
      if (!pd) { d4rows.push({ regime: src, status: "meta missing" }); continue; }
      d4rows.push({
        regime: src,
        status: pd.plan_status,
        comparable: pd.comparison_available,
        declaredNotPlanned: pd.counts?.declared_not_planned_offices ?? null,
        undeclaredPlanned: pd.counts?.undeclared_planned_offices ?? null,
        declaredPlanned: pd.counts?.declared_planned_offices ?? null,
      });
    }
  const comparable = d4rows.filter((r) => r.comparable);
  const d4 = {
    plans: d4rows.length,
    parsed: d4rows.filter((r) => r.status === "parsed_nonempty").length,
    comparable: comparable.length,
    meanDeclaredNotPlanned: comparable.length
      ? +(comparable.reduce((s, r) => s + r.declaredNotPlanned, 0) / comparable.length).toFixed(2) : null,
    meanUndeclaredPlanned: comparable.length
      ? +(comparable.reduce((s, r) => s + r.undeclaredPlanned, 0) / comparable.length).toFixed(2) : null,
    fullyMatching: comparable.filter((r) => r.declaredNotPlanned === 0 && r.undeclaredPlanned === 0).length,
  };

  strata.push({ tag, cells: tournaments.length, pairs, pooledNoise, d1, d1p, d3, d4 });
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(strata, null, 2));
} else {
  const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(0)}%` : "—");
  console.log("D1 — paired outcome per backend (primary: per-tournament noise floor)\n");
  console.log("| backend | cells | source wins | control wins | unresolved | excluded | source share of resolved |");
  console.log("|---|---|---|---|---|---|---|");
  for (const s of strata) {
    const res = s.d1.source + s.d1.control;
    console.log(`| cn:${s.tag} | ${s.cells} | ${s.d1.source} | ${s.d1.control} | ${s.d1.unresolved} | ${s.d1.excluded} | ${s.d1.source}/${res} ${pct(s.d1.source, res)} |`);
  }
  console.log("\nSensitivity — pooled per-backend noise floor (the stricter reading)\n");
  console.log("| backend | pooled floor | source | control | unresolved | excluded |");
  console.log("|---|---|---|---|---|---|");
  for (const s of strata)
    console.log(`| cn:${s.tag} | ${s.pooledNoise} | ${s.d1p.source} | ${s.d1p.control} | ${s.d1p.unresolved} | ${s.d1p.excluded} |`);

  console.log("\nD3 — instrument compliance per arm\n");
  console.log("| backend | arms | enforcement failed | participation absent |");
  console.log("|---|---|---|---|");
  for (const s of strata)
    console.log(`| cn:${s.tag} | ${s.d3.total} | ${s.d3.enforcementFailed} (${pct(s.d3.enforcementFailed, s.d3.total)}) | ${s.d3.participationAbsent} (${pct(s.d3.participationAbsent, s.d3.total)}) |`);

  console.log("\nD4 — pre-enforcement plan vs declared topology (source arms only)\n");
  console.log("| backend | plans | parsed | comparable | mean declared-but-unplanned | mean undeclared-planned | exact match |");
  console.log("|---|---|---|---|---|---|---|");
  for (const s of strata)
    console.log(`| cn:${s.tag} | ${s.d4.plans} | ${s.d4.parsed} | ${s.d4.comparable} | ${s.d4.meanDeclaredNotPlanned} | ${s.d4.meanUndeclaredPlanned} | ${s.d4.fullyMatching}/${s.d4.comparable} |`);
}
