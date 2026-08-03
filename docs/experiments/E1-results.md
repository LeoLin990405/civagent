# E1 — Results

Run 2026-07-30, 17:20–18:08 CST. Pre-registration: [E1-preregistration.md](./E1-preregistration.md),
committed at `7841c96` before the first match started.

Tournament ids:

| Scenario | Tournament id |
|---|---|
| S1 `plague-response-01` | `2026-07-30T09-20-18-212-10tm` |
| S2 `regional-militarization-01` | `2026-07-30T09-42-02-492-9d86` |
| S3 `border-city-autonomy-01` | `2026-07-30T10-01-21-688-yhiw` |

All fifteen matches ran on `cn:doubao`; all five civs within a scenario ran concurrently.

## Scores

| Rank | S1 plague | S2 militarization | S3 border city |
|---|---|---|---|
| 1 | china/ming **10** | china/tang **10** | china/qin **10** |
| 2 | china/qin 9.2 | china/ming **10** | china/tang **10** |
| 3 | global/athens 6.7 | global/athens 8.8 | china/ming 9.2 |
| 4 | china/zhou 5.8 | china/zhou 7.5 | global/athens 8.8 |
| 5 | china/tang 3.3 | china/qin 6.7 | china/zhou 8.8 |

## Pre-registered predictions

**P1 — the winner differs across at least two scenarios. HELD.**
Winners are ming, tang, qin. The reordering is large: tang moves from last (3.3)
to first (10.0); qin moves from second (9.2) to last (6.7). Whatever is being
measured, it is not a single fixed quality ordering.

**P2 — the predicted pattern places top two. 2 of 3.**

| | Predicted | Placed | |
|---|---|---|---|
| S1 | centralized (`china/qin`) | 2nd | ✅ |
| S2 | checks-and-balances (`china/tang`) | 1st | ✅ |
| S3 | federation (`china/zhou`) | **5th, last** | ❌ |

**P3 — the within-scenario spread must exceed the judge's own pass-to-pass
position effect. 2 of 3.** The manifest did not persist `biasReport` (see
"Defects found by running this", below), so these are recomputed from the raw
per-pass JSON in each `result.md`.

| | Score spread | Max position effect | |
|---|---|---|---|
| S1 | 6.67 | 1.67 | ✅ |
| S2 | 3.33 | 0.83 | ✅ |
| S3 | **1.25** | **1.67** | ❌ |

**S3's entire ranking sits inside the judge's own noise.** The gap between first
and last is smaller than the amount the same judge moved a single civilization
between its two passes. Nothing in the S3 column may be interpreted — including
P2's failure there. The correct reading of S3 is not "federation lost" but "this
cell produced no measurement".

## The finding that outranks all three predictions

Score tracks transcript length, and where it does not, the ranking is inside the
noise band.

| | Spearman ρ (score, transcript bytes) |
|---|---|
| S1 | **+1.00** — a perfect monotone match across all five civs |
| S2 | +0.70 |
| S3 | −0.30 (the cell that carries no signal anyway) |

The mechanism is worse than verbosity bias. The three shortest transcripts are
not short answers — they are **summaries of work that was never captured**:

- **`china/tang` in S1 (1,200 bytes, scored 3.3, last).** The transcript contains
  no policy at all. It is meta-commentary asserting that an edict "was already
  drafted, debated through two rounds of Menxia veto, revised, countersigned and
  dispatched to the Six Boards within this conversation" — none of which appears
  in the stream. The judge scored the claim, not the work.
- **`china/zhou` in S1 (1,720 bytes, scored 5.8, 4th).** Opens with `## 总结`
  ("Summary"). What is captured is a table summarizing a plan that is not present.
- **`china/qin` in S2 (1,866 bytes, scored 6.7, last).** Opens with
  `以上方案已就。要点总括如下` ("the plan above is complete; summary follows").
  The plan above does not exist in the transcript.

In each case the truncated cell is the lowest score in its scenario. Three of
fifteen cells (20%) are affected.

So E1 cannot distinguish the two worlds it was designed to separate. A third
explanation dominates both: **the ranking partly measures whether a regime's
answer was captured at all.** The verbosity budget does not fix this — capping
long transcripts at 6,000 characters lowers the ceiling but cannot raise a
1,200-byte stub, and the stub is not a short answer, it is a missing one.

This is the same instrumentation gap R8-2 hit from the other direction: the event
stream tags output by regime rather than by office, and the transcript captures
only what the process streamed to stdout. Internal deliberation between a
regime's offices is invisible to both.

## Defects found by running this

1. **`biasReport` was computed and thrown away.** `judge()` produced per-provider
   spread, same-family vs cross-family gap and the position effect; the manifest
   writer never persisted it. Every tournament ever run recorded a ranking with
   no way to ask whether the gaps exceeded the judge's own noise — which is
   exactly the question P3 asks. Fixed, with the assertion added to the manifest
   contract test. S1–S3 predate the fix, hence the manual recomputation above.
2. **Ceiling effect.** The 4-point rubric saturates: S3 has two 10.0s and no
   score below 8.8. When every civilization produces a competent answer the
   rubric cannot separate them, which is a large part of why S3 carries no signal.

## What should happen before E1 is re-run

Re-running as-is would produce another 20% invalid cells. In order:

1. **Fix transcript capture.** Until a regime's actual deliberation reaches the
   transcript, the judge is scoring an artifact of the harness. This is the
   blocker; everything else is secondary.
2. **Then add control arms.** Comparing five real topologies to each other cannot
   answer whether topology matters at all; `_baseline/*-random` can.
3. **Then repeat cells.** n = 1 per cell means the S1 tang result and the S2 qin
   result are single draws from an unmeasured distribution.
4. **Reconsider the rubric scale** for scenarios where all arms perform well.

## Status of the proposition

Unresolved, and honestly so. P1 held — the ordering genuinely reorders across
tasks, which is what world A predicts. But the strongest single correlate of
score in the two interpretable scenarios is transcript length, and the low
scores are traceable to missing transcripts rather than to governance quality.
No claim about whether governance topology affects multi-agent performance is
supported by this run.

---

## Follow-up (same day): the blocker is fixed, and E1 must be re-run

The root cause of the missing transcripts was found and fixed after this run.
It was not the model summarising instead of answering — the work was real and
the harness was discarding it.

**Cause.** The backend was spawned as `claude --agents <json> -p "<task>"`. The
default output format for `-p` is `text`, which prints only the coordinator's
final assistant message. A regime's offices are Claude Code subagents, so every
word they exchanged went to the subagent channel and was never captured.

**Correction to this document's reading of the tang S1 cell.** Above, that
transcript's claim that an edict "was already drafted, debated through two rounds
of Menxia veto ... and dispatched" is described as something the judge scored
instead of the work. The claim was **true**. A verification run of the same
regime on the same scenario, with capture fixed, produced three full rounds of
Chancellery *fengbo* review (5,262 + 4,247 + 3,004 characters), including
substantive historical criticism of the draft. The deliberation was happening
all along.

All character counts in this document and in the READMEs are what the code
reports — JavaScript `String.length`, i.e. UTF-16 code units. An earlier draft
said 72,828 for this transcript because it was hand-counted in Python, which
counts code points; the two differ by exactly the two astral characters (🔄) the
transcript contains. Both numbers are correct under their own definition, and
mixing them in one document is not.

**Effect.**

| | E1 (as run) | after the fix |
|---|---|---|
| turn events | 3 | 60 |
| captured characters | 579 | 72,830 |
| actors | `china/tang` | `china/tang` + `#zhongshu` `#menxia` `#shangshu` |

**A second defect, exposed by the first fix.** With office prose finally
reaching the mechanism engine, the first verification run was `SIGKILL`ed
mid-draft. The veto detector matched the bare substring *驳回*, and the
Secretariat had merely *described* the Chancellery's power to amend and return
documents. The same class of defect existed in all three mechanisms: `checkEdict`
matched bare *诏书* — the commonest noun in a Tang governance document — and
firing EDICT grants `vetoImmunity`, which would have silently disabled the veto
mechanism in exactly the regimes whose checks-and-balances behaviour is under
study. Only `[VETO]` is ever taught to agents as a marker; 33 of the 57 regime
files contain those bare words as ordinary vocabulary. All three now require
bracketed markers.

Both defects were dormant only because the transcripts were empty. Fixing
capture is what made them reachable.

**Status of E1.** Superseded. Every score above was produced from transcripts
that omitted most of what the regimes did, and the three lowest scores are the
three cells where the omission was worst. The pre-registration stands and should
be re-run unchanged, so that the same predictions are tested against transcripts
that contain the deliberation.
