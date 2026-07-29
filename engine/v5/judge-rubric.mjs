// judge-rubric.mjs — rubric prompt, anchored scoring dimensions, per-pass
// score parsing (JSON + legacy markdown-table), and cross-pass aggregation.
//
// Extracted from tournament.mjs so the rubric machinery is independently
// testable and reusable (e.g. by a future headless judge harness) without
// pulling in the full tournament orchestrator.

// ── Anchored rubric (blind judging) ─────────────────────────────────────────
// The judge scores every civilization on these three dimensions with an
// anchored 4-point scale and must answer with structured JSON. Anchors make
// scores comparable across passes (original vs swapped presentation order).
export const RUBRIC_DIMENSIONS = ["legality", "feasibility", "resilience"];
export const RUBRIC_SCALE = 4;

export const JUDGE_RUBRIC_PROMPT = `You are the blind judge of a CivAgent governance tournament.
Each civilization received the same task and produced a transcript of how its
governance system responded. You do not know which backend or model produced
which transcript — judge governance quality alone, and do not let presentation
order influence your scores.

Score EVERY civilization on EACH of the three dimensions below using the
anchored 4-point scale (integers 1-4 only). Calibrate HARD: most competent
answers belong at 2-3; reserve 4 for responses that clearly exceed a typical
strong answer. For each dimension, first pick the most likely score, then
challenge yourself: "is this REALLY worth a 4, or merely a solid 3?"

legality — did they respect their own rules and institutions?
  1 = Ignores or contradicts its own stated rules and procedures.
  2 = Invokes its rules but bends or selectively applies them when inconvenient.
  3 = Follows its own rules and procedures with only minor lapses or shortcuts.
  4 = Rigorously respects its own institutions; every action traces to a
      legitimate rule AND the response cites/uses those rules explicitly in a
      way a reader could verify (not just plausible-sounding governance prose).

feasibility — are the proposed actions executable?
  1 = Actions are impossible, incoherent, or ignore available resources entirely.
  2 = Actions are only partially executable; major resource or logistical gaps.
  3 = Actions are executable with reasonable effort; minor practical gaps remain.
  4 = Actions are concrete, resourced, and immediately executable as described —
      with specifics (quantities, steps, fallbacks) a competent operator could
      follow without further clarification; generic "do X carefully" is NOT a 4.

resilience — would this survive second-order effects?
  1 = Response collapses under obvious backlash, side effects, or changing conditions.
  2 = Response addresses the immediate problem but creates serious new risks.
  3 = Response anticipates some second-order effects and includes partial mitigation.
  4 = Response explicitly anticipates backlash and side effects with NON-OBVIOUS
      insight (failure modes a typical answer would miss) and builds in adaptation.

Output ONLY a JSON object — no prose, no markdown fences — of exactly this shape:
{"scores":[{"civilization":"<name>","legality":<1-4>,"feasibility":<1-4>,"resilience":<1-4>,"reason":"<one line>"}],"verdict":"<one paragraph naming the top civilization and why>"}
Use the exact civilization names given in the transcript section headers.`;

// Build the full per-pass judge prompt (rubric + task + ordered transcripts).
export function buildJudgePrompt(task, sections) {
  return `${JUDGE_RUBRIC_PROMPT}\n\n## Task\n${task}\n\n## Civilization Transcripts\n\n${sections}`;
}

// Match a judge-supplied civilization name back to a known regime string:
// exact match, then containment of the full id, then containment of the slug.
function matchRegime(name, civRegimes) {
  if (!name) return null;
  return (
    civRegimes.find((r) => name === r) ||
    civRegimes.find((r) => name.includes(r)) ||
    civRegimes.find((r) => name.includes(r.split("/")[1] || r)) ||
    null
  );
}

// Parse the judge's markdown output and extract per-regime scores.
// Handles lines like: | 1 | china/tang | 8.5 | reason |
// civRegimes is the full list of regime strings (e.g. ["china/tang", "china/qin"]).
// Returns [{regime, score}] sorted descending, or [] if nothing parseable.
export function parseJudgeScores(output, civRegimes) {
  if (!output) return [];
  const scores = [];
  for (const line of String(output).split("\n")) {
    const cells = line.split("|").map((s) => s.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    // Skip header/separator rows
    if (/^[-\s]+$/.test(cells[0]) || /rank/i.test(cells[0])) continue;
    // cells[1] should contain the civilization name
    const nameCell = cells[1] || "";
    const scoreCell = cells[2] || "";
    const reasonCell = cells[3] || "";
    const scoreMatch = scoreCell.match(/^(\d+(?:\.\d+)?)/);
    if (!scoreMatch) continue;
    // Match against known regime ids. Prefer exact (full id or slug), then fall
    // back to substring — but pick the LONGEST match so that e.g. "qing" is not
    // mis-bound to "qin", or "han-dynasty" to "han".
    const exact = civRegimes.find((r) => {
      const slug = r.split("/")[1] || r;
      return nameCell === r || nameCell === slug;
    });
    const regime =
      exact ||
      civRegimes
        .filter((r) => {
          const slug = r.split("/")[1] || r;
          return nameCell.includes(r) || nameCell.includes(slug);
        })
        .sort((a, b) => {
          const al = Math.max(a.length, (a.split("/")[1] || a).length);
          const bl = Math.max(b.length, (b.split("/")[1] || b).length);
          return bl - al;
        })[0];
    if (regime) {
      scores.push({ regime, score: parseFloat(scoreMatch[1]), reason: reasonCell });
    }
  }
  // Remove duplicates (first occurrence wins after sort)
  const seen = new Set();
  return scores
    .filter((s) => { if (seen.has(s.regime)) return false; seen.add(s.regime); return true; })
    .sort((a, b) => b.score - a.score);
}

// Parse the rubric JSON the anchored prompt asks for.
// Returns { scores: [{regime, dims, reason}], verdict } on success, or null
// when the output is not usable JSON (caller then falls back to the legacy
// markdown-table parser for backward compatibility).
export function parseJudgeJsonScores(output, civRegimes) {
  if (!output) return null;
  const s = String(output);
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let obj;
  try {
    obj = JSON.parse(s.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!obj || !Array.isArray(obj.scores)) return null;
  const scores = [];
  for (const entry of obj.scores) {
    if (!entry || typeof entry !== "object") continue;
    const regime = matchRegime(String(entry.civilization ?? entry.regime ?? ""), civRegimes);
    if (!regime) continue;
    const dims = {};
    let valid = true;
    for (const d of RUBRIC_DIMENSIONS) {
      const v = Number(entry[d]);
      if (!Number.isFinite(v) || v < 1 || v > RUBRIC_SCALE) { valid = false; break; }
      dims[d] = v;
    }
    if (!valid) continue;
    scores.push({ regime, dims, reason: typeof entry.reason === "string" ? entry.reason : "" });
  }
  if (scores.length === 0) return null;
  // First occurrence wins, mirroring parseJudgeScores' dedup behavior.
  const seen = new Set();
  const deduped = scores.filter((s) => (seen.has(s.regime) ? false : (seen.add(s.regime), true)));
  return { scores: deduped, verdict: typeof obj.verdict === "string" ? obj.verdict : "" };
}

// Aggregate per-pass results into final per-regime scores.
// passes: [{ swapped, perRegime: { [regime]: { score10, dims? } } }]
// Returns [{regime, score, dims?}] sorted descending; score is on a 10-point
// scale (rubric mean / 4 * 10) for continuity with the existing leaderboard.
export function aggregateJudgePasses(passes, civRegimes) {
  const acc = new Map(civRegimes.map((r) => [r, { score10: [], dims: Object.fromEntries(RUBRIC_DIMENSIONS.map((d) => [d, []])) }]));
  for (const p of passes) {
    for (const [regime, v] of Object.entries(p.perRegime || {})) {
      const a = acc.get(regime);
      if (!a) continue;
      if (Number.isFinite(v.score10)) a.score10.push(v.score10);
      if (v.dims) {
        for (const d of RUBRIC_DIMENSIONS) {
          if (Number.isFinite(v.dims[d])) a.dims[d].push(v.dims[d]);
        }
      }
    }
  }
  const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const out = [];
  for (const [regime, a] of acc) {
    if (a.score10.length === 0) continue;
    const dims = {};
    for (const d of RUBRIC_DIMENSIONS) {
      if (a.dims[d].length > 0) dims[d] = Math.round(mean(a.dims[d]) * 100) / 100;
    }
    out.push({
      regime,
      score: Math.round(mean(a.score10) * 10) / 10,
      ...(Object.keys(dims).length > 0 ? { dims } : {}),
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

// Should the judge run a second pass with the presentation order swapped?
// On by default; CIVAGENT_JUDGE_SWAP=0 disables.
export function judgeSwapEnabled(env = process.env) {
  return env.CIVAGENT_JUDGE_SWAP !== "0";
}
