/**
 * power.mjs — P6 runtime: confirmatory power and sample-size machinery
 * (plan §19/§20.1).
 *
 * The primary design is paired (within a block, historical vs random arms of
 * the same stratum/task judged by the same blind judge), so the power math is
 * the two-sided paired t-test:
 *
 *   n >= ( (z_{1-α/2} + z_{power}) / (δ/σ_d) )^2      (pair count)
 *   δ  = (z_{1-α/2} + z_{power}) * σ_d / sqrt(n)      (minimum detectable effect)
 *
 * The confirmatory run requires >=80% power at the preregistered minimum
 * effect size and >=30 matched blocks per reported provider stratum
 * (plan §20.1). Variance comes from the pilot; this module is machinery and
 * is validated against a Monte-Carlo simulation.
 */
import { canonicalJson, sha256Hex } from "../contracts/epoch-rules.mjs";

const Z = { 0.8: 0.8416212335729143, 0.9: 1.2815515655446004, 0.95: 1.6448536269514722 };
const Z_ALPHA = { 0.05: 1.959963984540054 };

export function zScore(level) {
  return Z[level] ?? (() => { throw new Error(`unsupported level ${level}`); })();
}

/** Required pair count for a paired two-sided test. */
export function requiredPairs({ effectSize, sd, alpha = 0.05, power = 0.8 }) {
  const z = (Z_ALPHA[alpha] ?? zScore(alpha)) + zScore(power);
  const d = effectSize / sd;
  return Math.ceil((z / d) ** 2);
}

/** Minimum detectable effect (paired difference) for a given pair count. */
export function minimumDetectableEffect({ pairs, sd, alpha = 0.05, power = 0.8 }) {
  const z = (Z_ALPHA[alpha] ?? zScore(alpha)) + zScore(power);
  return (z * sd) / Math.sqrt(pairs);
}

/**
 * Confirmatory plan from pilot variance: required pairs per stratum,
 * respecting the >=30 matched-blocks floor (plan §20.1).
 */
export function confirmatoryPlan({ pilotVariance, minEffect, alpha = 0.05, power = 0.8, strata = 4 }) {
  const sd = Math.sqrt(pilotVariance);
  const pairs = requiredPairs({ effectSize: minEffect, sd, alpha, power });
  const perStratum = Math.max(pairs, 30);
  const plan = {
    alpha, power,
    pilotVariance, minEffect,
    sd,
    pairsRequired: pairs,
    pairsPerStratum: perStratum,
    matchedBlocksPerStratum: perStratum,
    strata,
    totalPairedJudgings: perStratum * strata * 2, // 2 passes per pair
    digest: null,
  };
  plan.digest = sha256Hex(Buffer.from(canonicalJson({
    alpha: plan.alpha, power: plan.power, pairsPerStratum: plan.pairsPerStratum, strata: plan.strata,
  })));
  return plan;
}

/** Monte-Carlo validation: empirical power of the paired t-test at the plan's N. */
export function simulatePower({ trueEffect, sd, pairs, alpha = 0.05, trials = 2000, seed = 42 }) {
  let s = seed >>> 0;
  const rng = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const zCrit = Z_ALPHA[alpha] ?? 1.959963984540054;
  let rejected = 0;
  for (let t = 0; t < trials; t++) {
    const diffs = [];
    for (let i = 0; i < pairs; i++) {
      // paired difference ~ N(trueEffect, sd^2) via Box-Muller
      const u1 = Math.max(rng(), 1e-9);
      const u2 = rng();
      diffs.push(trueEffect + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2));
    }
    const mean = diffs.reduce((a, b) => a + b, 0) / pairs;
    const varEst = diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / (pairs - 1);
    const se = Math.sqrt(varEst / pairs);
    if (mean / se > zCrit) rejected++;
  }
  return rejected / trials;
}
