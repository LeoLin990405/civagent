import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getDb, getWritableDb } from '../db/database.mjs';
import { sendError } from '../http.mjs';

// Factory so tests can inject a temp state dir instead of reading ~/.civagent.
export function createHistoryRouter({ rootDir = path.join(os.homedir(), '.civagent') } = {}) {
  const router = express.Router();

  // Event types backfilled from match streams into episodic_memory by /sync.
  const SYNCED_EVENT_TYPES = ['veto_triggered', 'impeach_triggered', 'edict_triggered', 'skill'];

  // /api/history/sync — backfill episodic_memory from on-disk match event streams.
  router.post('/sync', (req, res) => {
    const db = getWritableDb();
    if (!db) return sendError(res, 503, 'Database not available');

    try {
      const matchesDir = path.join(rootDir, 'matches');
      let imported = 0;

      // Let the id autoincrement (it is an INTEGER PRIMARY KEY — a string id would
      // fail). Idempotency is achieved by clearing this match's synced rows first.
      const clearMatch = db.prepare(
        `DELETE FROM episodic_memory WHERE match_id = ? AND event_type IN (${SYNCED_EVENT_TYPES.map(() => '?').join(',')})`
      );
      const insertEvent = db.prepare(`
        INSERT INTO episodic_memory (regime, event_type, content, match_id, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);

      if (fs.existsSync(matchesDir)) {
        const dirs = fs.readdirSync(matchesDir);
        for (const dir of dirs) {
          const metaPath = path.join(matchesDir, dir, 'meta.json');
          const eventsPath = path.join(matchesDir, dir, 'events.jsonl');

          if (fs.existsSync(metaPath) && fs.existsSync(eventsPath)) {
            let regime = 'unknown';
            try {
              const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
              regime = meta.regime || 'unknown';
            } catch { /* keep default */ }

            const rawEvents = fs.readFileSync(eventsPath, 'utf8').split('\n');
            db.transaction(() => {
              clearMatch.run(dir, ...SYNCED_EVENT_TYPES);
              for (const line of rawEvents) {
                if (!line.trim()) continue;
                try {
                  const ev = JSON.parse(line);
                  if (SYNCED_EVENT_TYPES.includes(ev.type)) {
                    insertEvent.run(
                      regime, ev.type,
                      ev.reason || JSON.stringify(ev),
                      dir, ev.ts || Date.now()
                    );
                    imported++;
                  }
                } catch { /* skip bad line */ }
              }
            })();
          }
        }
      }

      res.json({ success: true, imported });
    } catch (err) {
      sendError(res, 500, err.message);
    }
  });

  // /api/history/:regime
  router.get('/:regime', (req, res) => {
    const regime = req.params.regime;
    const db = getDb();
    if (!db) return sendError(res, 503, 'Database not available');
    try {
      const stmt = db.prepare('SELECT id, event_type, content, match_id, timestamp FROM episodic_memory WHERE regime = ? ORDER BY timestamp DESC LIMIT 50');
      const rows = stmt.all(regime);
      res.json(rows);
    } catch (err) {
      sendError(res, 500, err.message);
    }
  });

  return router;
}

export default createHistoryRouter();
