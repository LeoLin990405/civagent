import express from 'express';
import { getDb } from '../db/database.mjs';

const router = express.Router();

// ── Query logic (pure: take a db handle, return data) — exported for tests ──────

// Per-regime score trends over time. timestamp is returned as numeric epoch-ms so
// the frontend chart can do time math directly (the column is a SQLite DATETIME
// string, which would produce NaN coordinates otherwise).
export function queryTrends(db) {
  const stmt = db.prepare(`
    SELECT m.regime, m.score,
           CAST(strftime('%s', t.timestamp) AS INTEGER) * 1000 AS timestamp,
           t.id as tournamentId
    FROM match_results m
    JOIN tournaments t ON m.tournament_id = t.id
    ORDER BY t.timestamp ASC
  `);
  const trends = {};
  for (const row of stmt.all()) {
    if (!trends[row.regime]) trends[row.regime] = [];
    trends[row.regime].push({ score: row.score, timestamp: row.timestamp, tournamentId: row.tournamentId });
  }
  return trends;
}

// A deterministic 3-axis capability profile derived from a regime's average score
// plus a stable hash of its name (so the radar is reproducible across calls).
export function queryRadar(db, regime) {
  const row = db.prepare('SELECT AVG(score) as avgScore FROM match_results WHERE regime = ?').get(regime);
  const avgScore = row && row.avgScore != null ? row.avgScore : 5; // default to 5 if no matches

  let hash = 0;
  for (let i = 0; i < regime.length; i++) {
    hash = ((hash << 5) - hash) + regime.charCodeAt(i);
    hash = hash & hash;
  }
  const seed1 = Math.abs(hash % 4) - 1.5;
  const seed2 = Math.abs((hash * 2) % 4) - 1.5;

  const legality = Math.max(1, Math.min(10, avgScore + seed1));
  const feasibility = Math.max(1, Math.min(10, avgScore + seed2));
  const resilience = Math.max(1, Math.min(10, avgScore - (seed1 + seed2) / 2));

  return {
    regime,
    legality: Number(legality.toFixed(1)),
    feasibility: Number(feasibility.toFixed(1)),
    resilience: Number(resilience.toFixed(1)),
    baseScore: Number(avgScore.toFixed(1)),
  };
}

// ── Routes ─────────────────────────────────────────────────────────────────────

// /api/analytics/trends
router.get('/trends', (req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'Database not available' });
  try {
    res.json(queryTrends(db));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/analytics/radar/:regime
router.get('/radar/:regime', (req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'Database not available' });
  try {
    res.json(queryRadar(db, req.params.regime));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
