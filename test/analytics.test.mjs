// analytics.test.mjs — regression tests for the analytics query logic against an
// in-memory SQLite DB (no ~/.civagent coupling). Locks in the timestamp-contract
// fix: trends must return numeric epoch-ms, not a SQLite DATETIME string.

import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { queryTrends, queryRadar } from "../server/routes/analytics.mjs";

function seedDb() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE tournaments (
      id TEXT PRIMARY KEY, task TEXT, judge TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE match_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT, tournament_id TEXT, match_id TEXT,
      regime TEXT, score INTEGER, reason TEXT, commentary TEXT
    );
  `);
  // Two tournaments at known UTC datetimes (the column type the server reads).
  db.prepare("INSERT INTO tournaments (id, task, timestamp) VALUES (?, ?, ?)")
    .run("t1", "famine", "2026-01-01 00:00:00");
  db.prepare("INSERT INTO tournaments (id, task, timestamp) VALUES (?, ?, ?)")
    .run("t2", "war", "2026-01-02 00:00:00");
  const ins = db.prepare("INSERT INTO match_results (tournament_id, match_id, regime, score) VALUES (?, ?, ?, ?)");
  ins.run("t1", "t1__china-tang", "china/tang", 8);
  ins.run("t1", "t1__china-qin", "china/qin", 6);
  ins.run("t2", "t2__china-tang", "china/tang", 9);
  return db;
}

test("queryTrends returns numeric epoch-ms timestamps (not DATETIME strings)", () => {
  const db = seedDb();
  try {
    const trends = queryTrends(db);
    assert.ok(trends["china/tang"], "tang has trend points");
    assert.equal(trends["china/tang"].length, 2);
    const pt = trends["china/tang"][0];
    assert.equal(typeof pt.timestamp, "number", "timestamp must be a number");
    // 2026-01-01T00:00:00Z = 1767225600000 ms
    assert.equal(pt.timestamp, Date.UTC(2026, 0, 1), "epoch-ms matches the UTC datetime");
    assert.ok(!Number.isNaN(pt.timestamp - trends["china/tang"][1].timestamp), "time math doesn't NaN");
  } finally {
    db.close();
  }
});

test("queryRadar returns a deterministic in-range profile", () => {
  const db = seedDb();
  try {
    const a = queryRadar(db, "china/tang");
    const b = queryRadar(db, "china/tang");
    assert.deepEqual(a, b, "radar is deterministic");
    for (const k of ["legality", "feasibility", "resilience", "baseScore"]) {
      assert.equal(typeof a[k], "number");
      assert.ok(a[k] >= 1 && a[k] <= 10, `${k} in [1,10]`);
    }
    // tang avg = (8+9)/2 = 8.5
    assert.equal(a.baseScore, 8.5);
  } finally {
    db.close();
  }
});

test("queryRadar defaults to baseScore 5 for an unknown regime", () => {
  const db = seedDb();
  try {
    const r = queryRadar(db, "global/atlantis");
    assert.equal(r.baseScore, 5);
  } finally {
    db.close();
  }
});
