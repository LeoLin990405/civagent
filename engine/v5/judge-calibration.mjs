// judge-calibration.mjs — bias measurement + verbosity control for the blind judge.
//
// CivAgent's rankings rest on "blind judging + Bradley-Terry". Three systematic
// biases are NOT fully hedged by the existing swap/anonymize machinery:
//   - position bias  : presentation order nudges scores
//   - verbosity bias : longer answers score higher (the judge is rewarding length)
//   - self-preference: a judge rates same-family output higher
//
// This module does not change scoring — it makes those biases VISIBLE so a
// ranking's statistical basis can be audited. All functions are pure (no I/O,
// no judge calls) so they are unit-testable with synthetic data.

import { BACKEND_COMMANDS } from "./backends.mjs";
import { JUDGE_PROVIDERS } from "./judge.mjs";

// ── Model family ──────────────────────────────────────────────────────────────
// "Family" = the underlying model house, derived from the binary a backend or
// judge resolves to. Self-preference is a within-house effect (e.g. a GLM-based
// judge favoring GLM civ output), so the family, not the exact id, is what to
// compare. Both civ backends ("cn:glm", "native") and judge providers ("cn-glm",
// "codex") are accepted — each is resolved to its command then to a family.
const FAMILY_FROM_CMD = {
  claude: "claude",
  codex: "codex",
  opencode: "opencode",
  "cc-glm": "glm",
  "cc-doubao": "doubao",
  "cc-qwen": "qwen",
  "cc-kimi": "kimi",
  "cc-stepfun": "stepfun",
  "cc-minimax": "minimax",
  "cc-mimo": "mimo",
};

// Resolve a civ backend id OR a judge provider id to a model family string.
// Unknown ids collapse to "unknown" (they then never count as same-family, which
// is the safe direction for a bias *measurement* — a false "same-family" would
// under-report self-preference).
export function modelFamilyOf(idOrCmd) {
  if (!idOrCmd) return "unknown";
  const id = String(idOrCmd);
  // Resolve to a binary command through every known mapping table:
  //   judge provider id ("cn-glm" → "cc-glm", "opencode-reviewer" → "opencode"),
  //   civ backend id      ("cn:glm" → "cc-glm", "native" → "claude"),
  //   or a bare command already (codex / opencode / claude / cc-*).
  const cmd =
    JUDGE_PROVIDERS[id]?.cmd ??
    BACKEND_COMMANDS[id] ??
    BACKEND_COMMANDS[id.toLowerCase()] ??
    (FAMILY_FROM_CMD[id] ? id : null);
  return (cmd && FAMILY_FROM_CMD[cmd]) || "unknown";
}

// ── Verbosity control ─────────────────────────────────────────────────────────
// Truncate each transcript section to a UNIFORM character budget so the judge
// cannot reward raw length. Critically, the structure is preserved: every civ is
// truncated the same way, so no one's answer is shown whole while another's is
// cut. A section looks like:
//     ### <name> (exit <code>)\n\n```\n<body>\n```
// Only <body> is trimmed; the header and the code fences stay so the judge still
// sees a well-formed section. Returns the trimmed sections plus an honest log of
// before/after lengths so the truncation is recorded in the manifest, never silent.

// Match the section envelope: header line, blank, opening fence, body, closing fence.
const SECTION_RE = /(^### [^\n]*\n\n```\n)([\s\S]*?)(\n```$)/;

export function applyVerbosityControl(sections, { budget = DEFAULT_VERBOSITY_BUDGET } = {}) {
  const log = [];
  const trimmed = sections.map((section) => {
    const m = SECTION_RE.exec(section);
    if (!m) {
      // Not a recognized section envelope — leave it untouched (do not corrupt).
      const chars = section.length;
      log.push({ beforeChars: chars, afterChars: chars, truncated: false });
      return section;
    }
    const [, head, body, tail] = m;
    const beforeChars = body.length;
    if (beforeChars <= budget) {
      log.push({ beforeChars, afterChars: beforeChars, truncated: false });
      return section;
    }
    // Trim the body to the budget. A leading ellipsis signals the truncation to
    // the judge (keeps the cut honest) while preserving the section shape.
    const trimmedBody = `…[truncated ${beforeChars - budget} chars]…\n${body.slice(-budget)}`;
    log.push({ beforeChars, afterChars: trimmedBody.length, truncated: true });
    return `${head}${trimmedBody}${tail}`;
  });
  return { sections: trimmed, verbosityLog: log };
}

// Default per-transcript body budget (chars, a cheap token proxy). Generous enough
// that most real transcripts pass through whole; small enough to cap a verbose one.
export const DEFAULT_VERBOSITY_BUDGET = 6000;

// ── Bias report ───────────────────────────────────────────────────────────────
// Summarize the per-pass judging data into a bias_report. All inputs are the
// already-collected results of a judge() run; nothing is recomputed from scratch.
//
// passes: [{ swapped, provider, order: [regime...], perRegime: { regime: { score10 } } }]
// civBackends: { regime: backendId }   — what produced each civ's answer
export function computeBiasReport({
  passes,
  civRegimes,
  civBackends = {},
  verbosityLog = [],
}) {
  const allScores = []; // { regime, provider, score, swapped, position }
  const perPass = [];

  for (const p of passes) {
    const order = p.order || [];
    const scored = [];
    for (let i = 0; i < order.length; i++) {
      const regime = order[i];
      const v = p.perRegime?.[regime];
      if (!v || !Number.isFinite(v.score10)) continue;
      const entry = { regime, provider: p.provider, score: v.score10, swapped: !!p.swapped, position: i };
      allScores.push(entry);
      scored.push({ regime, position: i, score: v.score10 });
    }
    perPass.push({ swapped: !!p.swapped, provider: p.provider, order, scores: scored });
  }

  // ── Per-provider mean + variance ──────────────────────────────────────────
  const byProvider = new Map();
  for (const s of allScores) {
    if (!byProvider.has(s.provider)) byProvider.set(s.provider, []);
    byProvider.get(s.provider).push(s.score);
  }
  const providerStats = [...byProvider.entries()].map(([provider, xs]) => {
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const variance = xs.length > 1 ? xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length : 0;
    return { provider, n: xs.length, mean: round(mean), variance: round(variance) };
  });

  // ── Same-family vs cross-family score gap (self-preference) ───────────────
  // For each judged score, is the judge's family the same as the civ backend's
  // family? Compare the mean of same-family vs cross-family judgments.
  const same = [];
  const cross = [];
  for (const s of allScores) {
    const judgeFamily = modelFamilyOf(s.provider);
    const civFamily = modelFamilyOf(civBackends[s.regime]);
    if (judgeFamily === "unknown" || civFamily === "unknown") continue; // can't classify
    (judgeFamily === civFamily ? same : cross).push(s.score);
  }
  const selfPreference = {
    sameFamilyCount: same.length,
    crossFamilyCount: cross.length,
    sameFamilyMean: same.length ? round(mean(same)) : null,
    crossFamilyMean: cross.length ? round(mean(cross)) : null,
    // Positive gap = judge favored same-family output (self-preference signal).
    gap: same.length && cross.length ? round(mean(same) - mean(cross)) : null,
  };

  // ── Position effect ───────────────────────────────────────────────────────
  // Same regime's score in the forward (swapped=false) pass vs the swapped pass.
  // A systematic sign means presentation order moved scores → position bias.
  const forward = new Map(); // regime -> score (first non-swapped pass that scored it)
  const reversed = new Map();
  for (const s of allScores) {
    if (s.swapped) { if (!reversed.has(s.regime)) reversed.set(s.regime, s.score); }
    else { if (!forward.has(s.regime)) forward.set(s.regime, s.score); }
  }
  const positionEffects = [];
  for (const regime of civRegimes) {
    if (forward.has(regime) && reversed.has(regime)) {
      positionEffects.push({ regime, forward: round(forward.get(regime)), swapped: round(reversed.get(regime)), delta: round(forward.get(regime) - reversed.get(regime)) });
    }
  }
  const positionEffect = {
    comparable: positionEffects.length,
    deltas: positionEffects,
    meanDelta: positionEffects.length ? round(mean(positionEffects.map((e) => e.delta))) : null,
    // Mean of absolute deltas — magnitude of order sensitivity regardless of sign.
    meanAbsDelta: positionEffects.length ? round(mean(positionEffects.map((e) => Math.abs(e.delta)))) : null,
  };

  // ── Verbosity summary ─────────────────────────────────────────────────────
  const truncated = verbosityLog.filter((v) => v.truncated).length;
  const verbosity = {
    budgetApplied: verbosityLog.length > 0,
    sections: verbosityLog.length,
    truncated,
    // mean pre-truncation body length, for spotting length-skew in the corpus
    meanBeforeChars: verbosityLog.length ? round(mean(verbosityLog.map((v) => v.beforeChars))) : null,
    meanAfterChars: verbosityLog.length ? round(mean(verbosityLog.map((v) => v.afterChars))) : null,
  };

  return { providerStats, selfPreference, positionEffect, verbosity, perPass };
}

function mean(xs) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function round(x) {
  return Math.round(x * 1000) / 1000;
}
