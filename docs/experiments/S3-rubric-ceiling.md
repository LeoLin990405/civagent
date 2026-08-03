# S3 rubric ceiling — calibration proposal

Status: design only. The production rubric is unchanged.

## Observed problem

In the original E1 S3 run, two regimes received 10.0 and the lowest received
8.8. The within-scenario spread was 1.25 while the largest pass-to-pass position
effect was 1.67. Those recorded values support only the conclusion already made
in `E1-results.md`: S3 did not produce an interpretable ranking. They do not
identify which replacement scale would work.

## Proposed calibration, before changing a score series

Keep the current anchored three-dimension, four-level rubric as the
confirmatory E1 endpoint so the re-run remains comparable to the registered
experiment. In a separately versioned shadow evaluation, compare candidate
instruments on the exact same stored transcripts:

1. retain legality, feasibility and resilience, but test more granular,
   behaviorally anchored levels;
2. test a forced pairwise comparison that asks only which transcript better
   satisfies one named dimension, with an explicit indistinguishable option;
3. record top-category mass, ties, forward/reverse disagreement and
   pass-to-pass movement for each candidate;
4. choose or reject a candidate under criteria registered before the shadow
   scores are inspected: it must reduce saturation without increasing order
   sensitivity or weakening inter-pass agreement.

The candidate wording, anchors, judge providers and decision criteria should be
frozen in a new preregistration. Shadow scores must be labelled exploratory and
must not replace the primary E1 scores.

## Comparability rule

Do not convert old four-level scores into a new scale, and do not splice a new
rubric into the existing Bradley–Terry series. If calibration justifies a new
instrument, give it a rubric version and begin a new score series; retain a
bridge set of identical transcripts judged under both versions so the
difference between instruments is visible rather than assumed away.

This proposal intentionally defines no unsupported conversion factor, expected
effect size or claim that a particular number of levels will solve the ceiling.
