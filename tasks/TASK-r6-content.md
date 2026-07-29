# TASK-r6-content: top-20 regime historical-fact revision

Status: PENDING
Priority: P1
Owner: Trae (MiMo)
Depends on: nothing (runs parallel to R6 code work; touches `regimes/**` only)

## Goal

Fact-check and revise the 20 most-used regimes so the management console
(R6-3) edits from a clean, reviewed baseline.

## Selection

20 regimes: 10 Chinese dynasties + 10 global empires, prioritizing tournament
staples (tang, qin, han, song, ming, qing, zhou, yuan, sparta, athens,
roman-republic, roman-empire, byzantine, ottoman, british, mongol, us-federal,
venice, egypt, mughal — final list may shift; record the chosen list in your
completion note).

## Per-regime checklist

- `metadata.json`: `era` dates, `system` characterization, `description.zh/en`
  claims — flag anachronisms and unsupported claims; keep both languages in
  sync (`regimes/**` are intentionally bilingual).
- `IDENTITY.md` role table: office titles against the Hucker standard
  (AGENTS.md rule 8 — e.g. Secretariat 中书省, Chancellery 门下省); verify the
  table structure stays intact — **never rewrite the table into prose**
  (AGENTS.md rule 2: prose parses to 0 agents).
- If `agentCount` must change, resync it to the compiled count (rule 3).
- `topology.json` (where present): node labels consistent with revised titles;
  run the validator after edits.

## Output

- Per-regime revision notes: `tasks/r6-revisions/<region>-<id>.md` (sources +
  what changed + what was deliberately left alone).
- Edits on a content branch; keep commits per regime for reviewability.

## Acceptance

```bash
npm run validate:regimes   # all 57 regimes stay mechanically valid
npm test                   # no regressions (parseIdentityTable sweep covers all 57)
```

Plus a Codex review pass over the content diff (historical claims, not just
mechanics).
