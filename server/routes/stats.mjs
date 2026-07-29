import express from 'express';
import path from 'node:path';
import os from 'node:os';
import { collectManifests, analyze, MIN_SAMPLE } from '../../engine/v5/stats.mjs';

const router = express.Router();

// /api/stats/rankings[?boot=N] — cross-tournament Bradley-Terry rankings + CI.
// Reuses engine/v5/stats.mjs directly (no shell-out). An empty dataset returns
// 200 with empty rankings + warnings, never a 500, so the UI can render calmly.
router.get('/rankings', (req, res) => {
  const tournamentsDir = path.join(os.homedir(), '.civagent', 'tournaments');
  const empty = (warning) => ({
    rankings: [],
    pairwise: [],
    warnings: [warning],
    tournamentsUsed: 0,
    regimes: [],
    B: 0,
    minSample: MIN_SAMPLE,
  });

  const manifests = collectManifests(tournamentsDir);
  if (manifests.length === 0) {
    return res.json(empty(`no tournament manifests found in ${tournamentsDir}`));
  }

  let B = 500; // lighter than the CLI default for interactive loads
  const q = req.query.boot;
  if (q != null) {
    const n = parseInt(String(q), 10);
    if (Number.isFinite(n)) B = Math.min(Math.max(n, 50), 2000);
  }

  try {
    const result = analyze(manifests, { B });
    res.json({ ...result, minSample: MIN_SAMPLE });
  } catch (e) {
    res.json(empty(`stats analysis failed: ${e.message}`));
  }
});

export default router;
