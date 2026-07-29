# TASK-r5-codex: review PR #29 (v6 hardening line merged with main P1-P6)

Status: DONE (2026-07-30)
Priority: P0

> **Completion note**: review delivered in `tasks/REVIEW-r5-codex.md` —
> REQUEST_CHANGES for both PRs (3 P1 on #29, 1 P1 on #30, 2 deferred P2s).
> All P1 findings fixed by Claude Code in `1080428` and `9426a8c` with
> regression tests (backend suite 252 → 287). Codex re-review pending.

## Scope

https://github.com/LeoLin990405/civagent/pull/29 — 29 commits, the union of
the v6 hardening line and main's P1–P6. CI is green (252 backend tests,
frontend tsc/lint/build). Review focus, highest risk first:

1. **Merge reconciliation of `engine/v5/tournament.mjs`** — the judge() now
   carries three orthogonal modes (swap passes, judgesN providers, anonymize).
   Check the pass-pooling math in `aggregateJudgePasses` still weights
   providers equally when one provider's pass fails midway (slotWorked granted
   on ANY successful pass — is a provider with 1/2 passes half-weighted, and
   is that acceptable?).
2. **Anonymization completeness** (`anonymizeCivs` in judge.mjs) — variants
   cover id/slug/metadata zh+en names. What leaks? (Backend names are already
   omitted; think: regime-specific agent ids like `zhongshu` inside
   transcripts — are they distinguishable enough to deanonymize a civ?)
3. **Write API** (`server/routes/tournaments.mjs`) — validate the validators:
   CIV_RE / BACKEND_RE / task cap. Anything spawnable through the civ string
   reaching `--civs` as a comma-joined argv element?
4. **replay.mjs lineage chase** — the `seen` loop-guard on broken on-disk
   lineage: can a crafted meta.json chain still loop or escape ~/.civagent?
5. **skill dedup gate placement** — findDuplicate runs before scan/audit; a
   prompt-injection skill that near-duplicates an existing benign skill is now
   rejected as duplicate BEFORE the injection scan sees it. Is that ordering
   exploitable (e.g. to hide injection variants from scan telemetry)?
6. **tang topology rewrite** — 9-node 三省 structure: verify the graph
   semantically matches the IDENTITY table flow (中书→门下→尚书→六部).

## Output format (write to tasks/REVIEW-r5-codex.md)

```markdown
## PR #29 review conclusion
### P0 (must fix before merging)
### P1 (recommended fix, within this round)
### P2 (handle next round)
### Conclusion: APPROVE / REQUEST_CHANGES
```
