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

    const stmtMatch = handle.prepare(`
      INSERT INTO match_results (tournament_id, match_id, regime, score, reason, commentary)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const stmtMem = handle.prepare('INSERT INTO episodic_memory (regime, event_type, content, match_id) VALUES (?, ?, ?, ?)');

    const insertMany = handle.transaction((rows) => {
      for (const res of rows) {
        stmtMatch.run(tournamentId, res.matchId, res.regime, res.score, res.reason, res.commentary || '');

        // Also add an episodic memory for this regime
        const content = `[Tournament Result] Score: ${res.score}/10. Reason: ${res.reason}. Historian Commentary: ${res.commentary || 'None'}`;
        stmtMem.run(res.regime, 'match_end', content, res.matchId);
      }
    });

    insertMany(results);
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
