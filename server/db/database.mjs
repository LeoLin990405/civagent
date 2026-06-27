import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import Database from 'better-sqlite3';

const rootDir = path.join(os.homedir(), '.civagent');
const dbPath = path.join(rootDir, 'civagent_history.db');

let db = null;
let writableDb = null;

export function initDb() {
  try {
    if (fs.existsSync(dbPath)) {
      db = new Database(dbPath, { readonly: true });
    }
  } catch (err) {
    console.error('Could not open history DB for reading:', err);
  }
}

export function getDb() {
  // Lazily (re)open if the DB file appeared after server start (e.g. the first
  // tournament created it). Returns null if it still doesn't exist.
  if (!db && fs.existsSync(dbPath)) initDb();
  return db;
}

// A separate writable handle for the few write endpoints (history backfill).
// The engine (engine/v5/history-db.mjs) is the primary writer; this shares the
// same WAL file and a busy_timeout so the two coexist without SQLITE_BUSY.
export function getWritableDb() {
  if (writableDb) return writableDb;
  try {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    writableDb = new Database(dbPath, { timeout: 15_000 });
    writableDb.pragma('busy_timeout = 15000');
    try { writableDb.pragma('journal_mode = WAL'); } catch { /* best-effort */ }
    // Ensure the schema exists even if the engine hasn't run yet.
    writableDb.exec(`
      CREATE TABLE IF NOT EXISTS episodic_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        regime TEXT,
        event_type TEXT,
        content TEXT,
        match_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    return writableDb;
  } catch (err) {
    console.error('Could not open history DB for writing:', err);
    writableDb = null;
    return null;
  }
}
