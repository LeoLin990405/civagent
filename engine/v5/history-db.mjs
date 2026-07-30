import Database from 'better-sqlite3';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

// ── Lazy, concurrency-safe SQLite handle ──────────────────────────────────────
//
// History: opening the DB and switching to WAL mode at *module import* time was a
// latent race. run-v5.mjs imports this (via history-retriever) on every single
// civ run, so a tournament spawning N concurrent civs had N processes all open
// the shared DB and race on `PRAGMA journal_mode = WAL`. Switching journal mode
// needs an exclusive lock and returns SQLITE_BUSY *immediately* (busy_timeout
// does not apply to journal-mode changes), crashing every loser before it could
// write its events.jsonl.
//
// Fixes:
//   1. Lazy open — a civ that never touches history never opens the DB.
//   2. Explicit busy_timeout so ordinary writes wait instead of failing.
//   3. WAL switch is best-effort with retry, and NEVER fatal: WAL is a
//      performance optimization, not a correctness requirement.

const dbPath = path.join(os.homedir(), '.civagent', 'civagent_history.db');

let db = null;       // cached handle (null until first use)
let dbFailed = false; // once true, stop retrying for this process

const BUSY_TIMEOUT_MS = 15_000;

function enableWalBestEffort(handle) {
  // A fresh DB starts in rollback-journal mode; the first opener must switch to
  // WAL, which needs exclusive access. Concurrent openers may collide — retry a
  // few times, then give up gracefully (the DB still works in its default mode).
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const mode = handle.pragma('journal_mode = WAL', { simple: true });
      if (mode === 'wal') return;
    } catch (err) {
      if (err && err.code !== 'SQLITE_BUSY') throw err;
    }
    // Tiny synchronous backoff to let the competing opener finish its switch.
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20 * (attempt + 1));
  }
  // Could not switch to WAL (another process holds it mid-init); proceed anyway.
}

function getDb() {
  if (db) return db;
  if (dbFailed) return null;
  try {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    const handle = new Database(dbPath, { timeout: BUSY_TIMEOUT_MS });
    // Make ordinary lock contention wait rather than throw SQLITE_BUSY.
    handle.pragma(`busy_timeout = ${BUSY_TIMEOUT_MS}`);
    enableWalBestEffort(handle);

    handle.exec(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY,
        task TEXT NOT NULL,
        judge TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS match_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id TEXT,
        match_id TEXT,
        regime TEXT,
        score INTEGER,
        reason TEXT,
        commentary TEXT,
        -- One row per (tournament, match) pair. Re-recording the same
        -- tournamentId (process retry, --id reuse) becomes a no-op on the
        -- match_results side instead of stacking rows that pollute Bradley-Terry
        -- counts. Re-record = INSERT OR IGNORE; the original row wins.
        UNIQUE(tournament_id, match_id),
        FOREIGN KEY(tournament_id) REFERENCES tournaments(id)
      );

      CREATE TABLE IF NOT EXISTS episodic_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regime TEXT,
        event_type TEXT,
        content TEXT,
        match_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db = handle;
    return db;
  } catch (err) {
    // History is auxiliary — a DB failure must never take down a match.
    console.error('[history-db] init failed, history disabled for this process:', err.message);
    dbFailed = true;
    return null;
  }
}

/**
 * Save a complete tournament result to the history DB
 */
export function recordTournamentResult(tournamentId, manifest, results) {
  const handle = getDb();
  if (!handle) return;
  try {
    const stmtTourn = handle.prepare('INSERT OR IGNORE INTO tournaments (id, task, judge) VALUES (?, ?, ?)');
    stmtTourn.run(tournamentId, manifest.task, manifest.judge ? manifest.judge.provider : 'unknown');

    // INSERT OR IGNORE on the UNIQUE(tournament_id, match_id) constraint makes a
    // second call with the same tournamentId a no-op for rows that already
    // exist. The original record wins; scores are never silently overwritten.
    // Observable side-effect: a `changes()` count of < results.length means we
    // hit a duplicate — surfaced via console.warn so a retry storm is visible.
    //
    // Migration for pre-existing DBs created before this constraint existed:
    // CREATE TABLE IF NOT EXISTS does not add the UNIQUE clause to a table
    // that's already there. CREATE UNIQUE INDEX IF NOT EXISTS is a no-op when
    // the inline UNIQUE is already in place, and adds the enforcement when it
    // isn't. SQLite raises SQLITE_CONSTRAINT if the existing data already has
    // duplicates that would violate the new constraint — caught here so the
    // engine still boots; the warning tells the operator what to do.
    // Migration for databases created before these constraints existed.
    //
    // Two failure modes a bare CREATE UNIQUE INDEX does not survive:
    //   1. the table already holds rows that violate the new uniqueness, so
    //      index creation raises SQLITE_CONSTRAINT. Logging and continuing
    //      leaves INSERT OR IGNORE with nothing to ignore against, and the
    //      stacking this fix exists to stop silently continues.
    //   2. an intermediate build of this fix put a table-wide unique index on
    //      (match_id, regime, event_type). Leaving it in place makes a plain
    //      INSERT of a second veto_triggered event fail, which is the data loss
    //      the partial index was introduced to avoid.
    // Both are handled: drop the superseded index, de-duplicate the offending
    // rows keeping the earliest (the original record wins, matching
    // INSERT OR IGNORE semantics), then create the index.
    try {
      handle.exec(`DROP INDEX IF EXISTS ux_episodic_memory_mre`);
    } catch (err) {
      console.warn('[history-db] could not drop superseded episodic_memory index:', err.message);
    }
    for (const [label, dedupe, create] of [
      [
        'match_results',
        `DELETE FROM match_results WHERE id NOT IN (
           SELECT MIN(id) FROM match_results GROUP BY tournament_id, match_id
         )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS ux_match_results_tm ON match_results(tournament_id, match_id)`,
      ],
      [
        'episodic_memory',
        `DELETE FROM episodic_memory WHERE event_type = 'match_end' AND id NOT IN (
           SELECT MIN(id) FROM episodic_memory WHERE event_type = 'match_end' GROUP BY match_id, regime
         )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS ux_episodic_memory_match_end ON episodic_memory(match_id, regime) WHERE event_type = 'match_end'`,
      ],
    ]) {
      try {
        handle.exec(create);
      } catch {
        // Pre-existing duplicates block the index. Collapse them, then retry —
        // and if the retry still fails, say so loudly rather than proceeding
        // with the constraint silently absent.
        try {
          const removed = handle.prepare(dedupe).run().changes;
          handle.exec(create);
          if (removed > 0) {
            console.warn(`[history-db] ${label}: collapsed ${removed} pre-existing duplicate row(s) to enforce idempotency`);
          }
        } catch (err2) {
          console.error(`[history-db] ${label}: uniqueness NOT enforced — re-recording will still stack rows:`, err2.message);
        }
      }
    }
    const stmtMatch = handle.prepare(`
      INSERT OR IGNORE INTO match_results (tournament_id, match_id, regime, score, reason, commentary)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const stmtMem = handle.prepare('INSERT OR IGNORE INTO episodic_memory (regime, event_type, content, match_id) VALUES (?, ?, ?, ?)');

    const insertMany = handle.transaction((rows) => {
      let skipped = 0;
      for (const res of rows) {
        const m = stmtMatch.run(tournamentId, res.matchId, res.regime, res.score, res.reason, res.commentary || '');
        if (m.changes === 0) skipped++;

        // Also add an episodic memory for this regime
        const content = `[Tournament Result] Score: ${res.score}/10. Reason: ${res.reason}. Historian Commentary: ${res.commentary || 'None'}`;
        stmtMem.run(res.regime, 'match_end', content, res.matchId);
      }
      return skipped;
    });

    const skipped = insertMany(results);
    if (skipped > 0) {
      // Re-record of an already-recorded tournament. The original rows win
      // (INSERT OR IGNORE). Surface this so a retry storm is observable — a
      // silent no-op would mask a real bug upstream.
      console.warn(`[history-db] tournament ${tournamentId}: ${skipped}/${results.length} match_result(s) already recorded, skipped (idempotent re-record)`);
    }
  } catch (err) {
    console.error('Failed to record tournament result:', err);
  }
}

/**
 * Retrieve episodic memory for a specific regime, matching keywords
 */
// How many of a regime's memories are eligible for scoring. This used to be a
// `LIMIT 10` in the SQL, which meant the keyword scoring only ever saw the ten
// most recent rows — everything a regime learned before its eleventh match was
// physically unreachable, no matter how well it matched the task. Scoring now
// runs over the regime's whole history; the cap only exists so a regime with
// thousands of matches cannot blow up memory, and it is deliberately far above
// any realistic corpus.
const MAX_SCANNED_MEMORIES = 5000;
// How many scored memories are handed to the prompt.
const TOP_MEMORIES = 3;

export function queryEpisodicMemory(regime, keywords, { limit = TOP_MEMORIES } = {}) {
  const handle = getDb();
  if (!handle) return [];
  try {
    // `timestamp` defaults to CURRENT_TIMESTAMP, which SQLite records at
    // second granularity — every memory written during the same second ties,
    // and the order among ties is unspecified. The AUTOINCREMENT id is the only
    // reliable insertion order, so it breaks the tie. Without it "most recent"
    // was arbitrary, and combined with the old row cap the retriever could
    // silently scan the OLDEST rows instead of the newest.
    const stmt = handle.prepare(`
      SELECT content, timestamp FROM episodic_memory
      WHERE regime = ?
      ORDER BY timestamp DESC, id DESC
      LIMIT ?
    `);
    const rows = stmt.all(regime, MAX_SCANNED_MEMORIES);

    // In-memory keyword scoring over the full eligible set.
    const scored = rows.map(r => {
      let score = 0;
      const lower = r.content.toLowerCase();
      for (const kw of keywords) {
        if (lower.includes(kw)) score++;
      }
      return { ...r, score };
    });

    // Ties are broken by recency: rows arrive newest-first and sort is stable,
    // so an older memory never displaces an equally relevant newer one.
    return scored.filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (err) {
    console.error('Failed to query episodic memory:', err);
    return [];
  }
}
