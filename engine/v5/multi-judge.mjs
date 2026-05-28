// multi-judge.mjs — blind multi-judge aggregation for tournament evaluation.
//
// Each judge receives the same prompt with civ names replaced by anonymous labels
// (Civ-A, Civ-B …) to prevent alphabetical-order or name-recognition bias.
// Multiple providers run independently; their scores are averaged and their
// individual verdicts are concatenated into a meta-verdict.

import { runJudge, DEFAULT_JUDGE_CHAIN, resolveJudgeChain } from "./judge.mjs";

// Replace each civ name in `prompt` with an anonymous label and return both the
// anonymized prompt and the mapping needed to reverse it.
//
// Replacement is done in descending name-length order so that longer names
// (e.g. "china/jin-jurchen") are substituted before any shorter name that is a
// prefix of them (e.g. "china/jin"), preventing partial corruption like
// "Civ-A-jurchen" appearing in the output.
export function anonymizePrompt(prompt, civNames) {
  const map = civNames.map((name, i) => ({
    real: name,
    anon: `Civ-${String.fromCharCode(65 + i)}`, // Civ-A, Civ-B, …
  }));
  // Sort a scratch copy by descending length; the `map` index stays unchanged
  // so Civ-A always refers to civNames[0] in the caller's de-anonymize step.
  const byLength = [...map].sort((a, b) => b.real.length - a.real.length);
  let out = String(prompt);
  for (const { real, anon } of byLength) {
    out = out.split(real).join(anon);
  }
  return { prompt: out, map };
}

// Parse a Markdown table from judge output.
// Accepts three common formats:
//   Format A: Rank | Civ-X | Score /10 | Reason     (single score, rank prefix)
//   Format B: Rank | Civ-X | L  | F  | R            (triple score, rank prefix)
//   Format C: Civ-X | L | F | R                     (triple score, no rank)
// Returns Map<civLabel, {legality, feasibility, resilience, avg}> or null.
export function parseScoreTable(markdown) {
  if (!markdown) return null;
  const rows = markdown.split("\n").filter((l) => l.includes("|"));
  const result = new Map();

  for (const row of rows) {
    const cells = row.split("|").map((s) => s.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    // Skip header rows
    const first = cells[0].toLowerCase();
    if (first === "rank" || first === "civilization" || first === "regime" || first.startsWith("-")) continue;

    // Detect which cell holds the Civ-X label.
    const civInCol1 = cells[1] && /Civ-[A-Z]/.test(cells[1]); // Format A or B
    const civInCol0 = cells[0] && /Civ-[A-Z]/.test(cells[0]); // Format C
    if (!civInCol1 && !civInCol0) continue;

    if (civInCol1) {
      // Formats A / B: [rank, Civ-X, score(s), ...]
      const civLabel = cells[1];
      const scoreCell = cells[2] || "";
      // Single-score: "8.5/10" or "8.5"
      const singleMatch = scoreCell.match(/^(\d+\.?\d*)\s*(?:\/\s*10)?$/);
      if (singleMatch) {
        const avg = parseFloat(singleMatch[1]);
        result.set(civLabel, { legality: avg, feasibility: avg, resilience: avg, avg });
        continue;
      }
      // Triple-score: cells[2]=L cells[3]=F cells[4]=R
      const l = parseFloat(cells[2]);
      const f = parseFloat(cells[3]);
      const r = parseFloat(cells[4]);
      if (!isNaN(l) && !isNaN(f) && !isNaN(r)) {
        result.set(civLabel, { legality: l, feasibility: f, resilience: r, avg: (l + f + r) / 3 });
      }
    } else {
      // Format C: [Civ-X, L, F, R]
      const civLabel = cells[0];
      const l = parseFloat(cells[1]);
      const f = parseFloat(cells[2]);
      const r = parseFloat(cells[3]);
      if (!isNaN(l) && !isNaN(f) && !isNaN(r)) {
        result.set(civLabel, { legality: l, feasibility: f, resilience: r, avg: (l + f + r) / 3 });
      }
    }
  }

  return result.size > 0 ? result : null;
}

// Average scores from multiple judges and de-anonymize civ labels.
// judges: Array<{ provider, scores: Map|null, raw: string|null, error?: string }>
// deAnonymizeMap: the `.map` array returned by anonymizePrompt
export function aggregateJudgements(judges, deAnonymizeMap) {
  const successfulJudges = judges.filter((j) => j.scores && j.scores.size > 0);
  if (!successfulJudges.length) {
    return {
      scores: new Map(),
      verdict: judges.map((j) => `[${j.provider}]: ${j.error || "(no scores parsed)"}`).join("\n"),
      providers: judges.map((j) => j.provider).filter(Boolean),
    };
  }

  const allAnon = new Set(successfulJudges.flatMap((j) => [...j.scores.keys()]));
  const avgMap = new Map();

  for (const anon of allAnon) {
    const vals = successfulJudges.map((j) => j.scores.get(anon)).filter(Boolean);
    if (!vals.length) continue;
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    avgMap.set(anon, {
      legality: mean(vals.map((v) => v.legality)),
      feasibility: mean(vals.map((v) => v.feasibility)),
      resilience: mean(vals.map((v) => v.resilience)),
      avg: mean(vals.map((v) => v.avg)),
      judgeCount: vals.length,
    });
  }

  // De-anonymize: replace Civ-A → real regime id
  const scores = new Map();
  for (const [anon, val] of avgMap) {
    const entry = deAnonymizeMap.find((m) => m.anon === anon);
    scores.set(entry ? entry.real : anon, val);
  }

  const verdict = successfulJudges
    .map((j) => `### Judge: ${j.provider}\n\n${j.raw || "(empty)"}`)
    .join("\n\n---\n\n");

  return {
    scores,
    verdict,
    providers: successfulJudges.map((j) => j.provider),
  };
}

// Run N judges in blind mode against tournament civ transcripts.
// civResults: Array<{ regime, backend, matchId, transcript }>
// Returns { scores: Map, verdict: string, providers: string[] }
export function runMultiJudge(basePrompt, civResults, {
  judgeChain = DEFAULT_JUDGE_CHAIN,
  judgesN = 2,
  timeout = 120_000,
  _runJudge = runJudge,
} = {}) {
  // Resolve the full chain — do NOT slice yet.  We iterate until we have
  // collected judgesN *successful* judge results, skipping unavailable
  // providers rather than letting them consume one of the N slots.
  const chain = resolveJudgeChain(judgeChain);
  if (!chain.length) {
    return { scores: new Map(), verdict: "No judges available", providers: [] };
  }

  const civNames = civResults.map((r) => r.regime);
  const { prompt: anonPrompt, map } = anonymizePrompt(basePrompt, civNames);

  const judgeResults = [];
  let successCount = 0;
  for (const provider of chain) {
    if (successCount >= judgesN) break;
    try {
      const r = _runJudge(anonPrompt, { providers: [provider], timeout });
      const scores = parseScoreTable(r.output);
      judgeResults.push({ provider: r.provider, scores, raw: r.output });
      if (scores && scores.size > 0) successCount++;
    } catch (e) {
      // Provider unavailable — record the failure but keep trying the rest.
      judgeResults.push({ provider, scores: null, raw: null, error: e.message });
    }
  }

  return aggregateJudgements(judgeResults, map);
}
