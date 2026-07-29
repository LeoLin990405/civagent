// server.test.mjs — smoke tests for the read-only API server.
// Mounts the Express app on an ephemeral port (no fixed :3001) and exercises the
// filesystem-backed read endpoints. DB-backed endpoints are intentionally not
// asserted here so the test is deterministic regardless of ~/.civagent state.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/index.mjs";

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function withServer(fn) {
  const server = await listen(createApp());
  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test("GET /api/health returns ok + version", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.equal(body.version, "6.0.0");
    assert.equal(typeof body.uptime, "number");
  });
});

test("GET /api/regimes lists all 57 regimes with metadata", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/regimes`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body), "response is an array");
    assert.equal(body.length, 57, "all 57 regimes listed");
    const tang = body.find((r) => r.id === "china/tang");
    assert.ok(tang, "china/tang present");
    assert.equal(tang.metadata.agentCount, 9, "tang agentCount matches its table");
    assert.ok(typeof tang.identity === "string" && tang.identity.length > 0);
  });
});

test("GET /api/regimes/:region/:id/mechanisms returns an array", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/regimes/china/tang/mechanisms`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.mechanisms), "mechanisms is an array");
  });
});

test("invalid regime id segment is rejected (path-safety)", async () => {
  await withServer(async (base) => {
    // "ta.ng" fails the SAFE_ID guard (dots disallowed) → 400 from safeResolve.
    const res = await fetch(`${base}/api/regimes/china/ta.ng/mechanisms`);
    assert.equal(res.status, 400);
  });
});
