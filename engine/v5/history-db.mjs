import Database from 'better-sqlite3';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const dbPath = path.join(os.homedir(), '.civagent', 'civagent_history.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
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

/**
 * Save a complete tournament result to the history DB
 */
export function recordTournamentResult(tournamentId, manifest, results) {
  try {
    const stmtTourn = db.prepare('INSERT OR IGNORE INTO tournaments (id, task, judge) VALUES (?, ?, ?)');
    stmtTourn.run(tournamentId, manifest.task, manifest.judge ? manifest.judge.provider : 'unknown');

    const stmtMatch = db.prepare(`
      INSERT INTO match_results (tournament_id, match_id, regime, score, reason, commentary)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((results) => {
      for (const res of results) {
        stmtMatch.run(tournamentId, res.matchId, res.regime, res.score, res.reason, res.commentary || '');
        
        // Also add an episodic memory for this regime
        const stmtMem = db.prepare('INSERT INTO episodic_memory (regime, event_type, content, match_id) VALUES (?, ?, ?, ?)');
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
export function queryEpisodicMemory(regime, keywords) {
  try {
    const stmt = db.prepare(`
      SELECT content, timestamp FROM episodic_memory 
      WHERE regime = ? 
      ORDER BY timestamp DESC
      LIMIT 10
    `);
    const rows = stmt.all(regime);
    
    // In-memory keyword filtering
    const scored = rows.map(r => {
      let score = 0;
      const lower = r.content.toLowerCase();
      for (const kw of keywords) {
        if (lower.includes(kw)) score++;
      }
      return { ...r, score };
    });

    return scored.filter(r => r.score > 0).sort((a,b) => b.score - a.score).slice(0, 3);
  } catch (err) {
    console.error('Failed to query episodic memory:', err);
    return [];
  }
}
