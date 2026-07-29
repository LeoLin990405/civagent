// judge.mjs — pluggable evaluation/review provider for CivAgent.
//
// Used by tournament.mjs (rank civilizations) and skill-sediment.mjs (audit a
// proposed learned skill). Provides retry + provider fallback so a single flaky
// engine doesn't sink the whole pipeline.
//
// HARD RULE: gemini is NEVER a provider here (project policy). It is absent from
// the table AND filtered out of any caller-supplied chain, so it cannot be
// reintroduced by accident or by a stale config.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseIdentityAgentIds } from "../topology/validate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGIMES_ROOT = path.resolve(__dirname, "../../regimes");

// id → how to invoke it. Prompt is always passed as the final positional arg so
// callers don't have to worry about stdin plumbing.
export const JUDGE_PROVIDERS = {
  codex: { cmd: "codex", args: (prompt) => ["exec", "--skip-git-repo-check", prompt] },
  "opencode-reviewer": { cmd: "opencode", args: (prompt) => ["run", "--agent", "reviewer", prompt] },
  "cn-glm": { cmd: "cc-glm", args: (prompt) => ["-p", prompt] },
};

// Default order: codex (strongest reasoner) → opencode reviewer → glm fork.
export const DEFAULT_JUDGE_CHAIN = ["codex", "opencode-reviewer", "cn-glm"];

export function hasBinary(cmd, _spawn = spawnSync) {
  return _spawn("which", [cmd], { stdio: "ignore" }).status === 0;
}

// Resolve an ordered, gemini-free, de-duplicated, known-only provider chain.
export function resolveJudgeChain(preferred = DEFAULT_JUDGE_CHAIN) {
  const seen = new Set();
  const chain = [];
  for (const idRaw of preferred) {
    const id = String(idRaw);
    if (id.toLowerCase() === "gemini") continue; // hard rule: never gemini
    if (!JUDGE_PROVIDERS[id] || seen.has(id)) continue;
    seen.add(id);
    chain.push(id);
  }
  return chain;
}

// ── Civ anonymization (blind judging, R2 revived) ───────────────────────────
// Replace every recognisable name of each civ — full id ("china/tang"), slug
// ("tang"), and the display names from its metadata ("唐朝", "Tang Dynasty") —
// with a positional label (Civ-A, Civ-B, …). Replacement runs in descending
// variant-length order so a longer name is never corrupted by a shorter prefix
// ("china/jin-jurchen" before "china/jin"; "Tang Dynasty" before "tang").
// Codex review P1(c): stripping only regime ids left display names in the
// transcripts, defeating the blinding — metadata names are covered here.
export function anonymizeCivs(civRegimes, { regimesRoot = REGIMES_ROOT } = {}) {
  const labels = civRegimes.map((_, i) => `Civ-${String.fromCharCode(65 + i)}`);
  const realFor = new Map(labels.map((l, i) => [l, civRegimes[i]]));
  const labelFor = new Map(civRegimes.map((r, i) => [r, labels[i]]));

  const variants = []; // [{ text, label }]
  civRegimes.forEach((regime, i) => {
    const label = labels[i];
    variants.push({ text: regime, label });
    const slug = regime.split("/")[1];
    if (slug) variants.push({ text: slug, label });
    try {
      const meta = JSON.parse(
        fs.readFileSync(path.join(regimesRoot, regime, "metadata.json"), "utf8"),
      );
      for (const name of [meta?.name?.zh, meta?.name?.en]) {
        if (typeof name === "string" && name.trim()) variants.push({ text: name.trim(), label });
      }
    } catch { /* regime dir without metadata — ids/slug still covered */ }

    // Role names are as identifying as the regime name: a transcript saying
    // "zhongshu drafts, menxia vetoes" names the Tang three-department system
    // outright. Replace every agent id and office label with a neutral,
    // per-civ role slot (Civ-A-R1 …) so the judge can still follow who did
    // what without being able to recognise which regime it is.
    let slot = 0;
    const seen = new Set();
    const slotOf = new Map(); // agent id / office name → its role slot
    // One slot per ROLE, not per spelling: a node's id and its office label are
    // the same actor, so they must map to the same Civ-A-Rn or the judge will
    // read one department as two.
    const pushRole = (...spellings) => {
      const forms = [];
      for (const raw of spellings) {
        const t = typeof raw === "string" ? raw.trim() : "";
        // 1-char names are too generic to substitute safely (they'd shred prose).
        if (t.length < 2 || seen.has(t)) continue;
        forms.push(t);
        // Topology labels carry a parenthetical gloss ("中书省（起草）"); the bare
        // office name is what actually appears in a transcript.
        const bare = t.replace(/[（(][^）)]*[）)]\s*$/, "").trim();
        if (bare.length >= 2 && bare !== t && !seen.has(bare)) forms.push(bare);
      }
      if (forms.length === 0) return;
      const slotLabel = `${label}-R${++slot}`;
      for (const f of forms) {
        seen.add(f);
        slotOf.set(f, slotLabel);
        variants.push({ text: f, label: slotLabel });
      }
    };
    try {
      const topo = JSON.parse(
        fs.readFileSync(path.join(regimesRoot, regime, "topology.json"), "utf8"),
      );
      for (const n of topo?.nodes ?? []) pushRole(n?.id, n?.label);
    } catch { /* no topology.json — fall back to the IDENTITY table below */ }
    try {
      const identity = fs.readFileSync(path.join(regimesRoot, regime, "IDENTITY.md"), "utf8");
      // Agent ids already covered by a topology node keep that node's slot.
      for (const id of parseIdentityAgentIds(identity)) pushRole(id);
    } catch { /* no IDENTITY.md — regime/topology coverage still applies */ }
  });
  // Longest first, so "libu_personnel" is consumed before "libu", and
  // "china/jin-jurchen" before "china/jin".
  variants.sort((a, b) => b.text.length - a.text.length);

  const transform = (text) => {
    let out = String(text);
    for (const { text: t, label } of variants) out = out.split(t).join(label);
    return out;
  };
  // Reverse mapping for human-facing output (verdict paragraphs).
  const detransform = (text) => {
    let out = String(text);
    for (const [label, real] of realFor) out = out.split(label).join(real);
    return out;
  };

  return { labels, realFor, labelFor, transform, detransform };
}

// Run the first available provider in the chain, retrying each `retries` times
// before falling through to the next. Returns { provider, attempt, output }.
// Throws only if every provider is unavailable or fails.
export function runJudge(prompt, {
  providers = DEFAULT_JUDGE_CHAIN,
  timeout = 300_000,
  retries = 1,
  _spawn = spawnSync,
  _has = hasBinary,
} = {}) {
  const resolved = resolveJudgeChain(providers);
  const available = resolved.filter((id) => _has(JUDGE_PROVIDERS[id].cmd, _spawn));
  if (available.length === 0) {
    throw new Error(
      `no judge provider available (chain: ${resolved.join(", ") || "none"}); ` +
        `gemini is disabled by policy`,
    );
  }
  const errors = [];
  for (const id of available) {
    const { cmd, args } = JUDGE_PROVIDERS[id];
    for (let attempt = 0; attempt <= retries; attempt++) {
      // maxBuffer: judge transcripts can exceed Node's 1 MB stdout default,
      // which would otherwise fail the call with ERR_CHILD_PROCESS_STDIO_MAXBUFFER.
      const r = _spawn(cmd, args(prompt), {
        encoding: "utf8",
        timeout,
        env: process.env,
        maxBuffer: 64 * 1024 * 1024,
      });
      if (r.status === 0 && r.stdout != null) {
        return { provider: id, attempt, output: String(r.stdout).trim() };
      }
      errors.push(`${id}#${attempt}: ${r.stderr?.toString().trim() || r.error?.message || `exit ${r.status}`}`);
    }
  }
  throw new Error(`all judge providers failed:\n${errors.join("\n")}`);
}
