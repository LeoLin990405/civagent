// tournaments-write-api.test.mjs — POST /api/tournaments (the write API).
// Mounts the tournaments router with an injected fake spawn and a temp state
// dir, so no real tournament process is ever launched and no ~/.civagent state
// is touched. Also exercises the GET endpoints against fixture manifests.

import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createTournamentsRouter } from "../server/routes/tournaments.mjs";
import { TOURNAMENT_ID_RE } from "../engine/v5/tournament.mjs";

function makeApp({ spawnFn, rootDir }) {
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  app.use("/api/tournaments", createTournamentsRouter({ spawnFn, rootDir }));
  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function withWriteServer(fn) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-writeapi-"));
  const calls = [];
  const fakeSpawn = (cmd, args, opts) => {
    calls.push({ cmd, args, opts });
    return { unref() {} };
  };
  const server = await listen(makeApp({ spawnFn: fakeSpawn, rootDir }));
  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`, calls, rootDir);
  } finally {
    server.close();
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
}

function post(base, body) {
  return fetch(`${base}/api/tournaments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("POST /api/tournaments launches detached and answers 202 with an id", async () => {
  await withWriteServer(async (base, calls) => {
    const res = await post(base, { civs: ["china/tang", "china/qin"], task: "handle a famine" });
    assert.equal(res.status, 202);
    const body = await res.json();
    assert.match(body.tournamentId, TOURNAMENT_ID_RE, "id is path-safe");

    assert.equal(calls.length, 1, "exactly one spawn");
    const { cmd, args, opts } = calls[0];
    assert.equal(cmd, process.execPath, "spawns node itself");
    assert.ok(args[0].endsWith(path.join("engine", "v5", "tournament.mjs")), "runs tournament.mjs directly");
    assert.deepEqual(args.slice(1, 3), ["--civs", "china/tang,china/qin"]);
    assert.deepEqual(args.slice(3, 5), ["--id", body.tournamentId], "pre-generated id is passed through");
    assert.equal(args[args.length - 1], "handle a famine", "task is the trailing arg");
    assert.equal(opts.detached, true, "background process must be detached");
    assert.equal(opts.stdio[0], "ignore");
  });
});

test("POST applies a shared backend only to civs without an explicit one", async () => {
  await withWriteServer(async (base, calls) => {
    const res = await post(base, {
      civs: ["china/tang", "global/athens#cn:glm"],
      task: "t",
      backend: "cn:doubao",
    });
    assert.equal(res.status, 202);
    const civArg = calls[0].args[2];
    assert.equal(civArg, "china/tang#cn:doubao,global/athens#cn:glm");
  });
});

test("POST passes --no-skill through when noSkill=true", async () => {
  await withWriteServer(async (base, calls) => {
    const res = await post(base, { civs: ["china/tang"], task: "t", noSkill: true });
    assert.equal(res.status, 202);
    assert.ok(calls[0].args.includes("--no-skill"));
  });
});

test("POST writes a launch log under the state dir", async () => {
  await withWriteServer(async (base, _calls, rootDir) => {
    const res = await post(base, { civs: ["china/tang"], task: "t" });
    const { tournamentId } = await res.json();
    const logPath = path.join(rootDir, "server-logs", `${tournamentId}.launch.log`);
    assert.ok(fs.existsSync(logPath), "launch log created");
  });
});

test("POST validation: civs list shape", async () => {
  await withWriteServer(async (base, calls) => {
    for (const civs of [
      undefined,
      [],
      Array.from({ length: 9 }, (_, i) => `china/tang${i}`),   // > 8
      ["not-a-regime"],
      ["china/Tang"],                                          // uppercase id
      ["china/tang; rm -rf /"],                                // injection attempt
      ["../../etc"],
      [42],
    ]) {
      const res = await post(base, { civs, task: "t" });
      assert.equal(res.status, 400, `civs=${JSON.stringify(civs)} must be rejected`);
    }
    assert.equal(calls.length, 0, "no spawn on any invalid input");
  });
});

test("POST validation: task and backend", async () => {
  await withWriteServer(async (base, calls) => {
    for (const body of [
      { civs: ["china/tang"] },                                  // missing task
      { civs: ["china/tang"], task: "" },
      { civs: ["china/tang"], task: "   " },
      { civs: ["china/tang"], task: "x".repeat(2001) },          // over cap
      { civs: ["china/tang"], task: "t", backend: "cn:doubao; whoami" },
      { civs: ["china/tang"], task: "t", backend: 42 },
    ]) {
      const res = await post(base, body);
      assert.equal(res.status, 400, `${JSON.stringify(body).slice(0, 60)} must be rejected`);
    }
    assert.equal(calls.length, 0, "no spawn on any invalid input");
  });
});

// Codex review R5 P1(2): BACKEND_RE/CIV_RE only checked the shape, so an
// unknown backend got a 202 and failed later inside the detached child — the
// client was told a tournament had started that could never run.
test("POST rejects unknown backends instead of accepting a doomed run", async () => {
  await withWriteServer(async (base, calls) => {
    const shared = await post(base, { civs: ["china/tang"], task: "t", backend: "notreal" });
    assert.equal(shared.status, 400);
    assert.match((await shared.json()).error, /unknown backend/);

    const pinned = await post(base, { civs: ["china/tang#alsofake"], task: "t" });
    assert.equal(pinned.status, 400);
    assert.match((await pinned.json()).error, /unknown backend in civ/);

    assert.equal(calls.length, 0, "nothing is spawned for an unrunnable backend");

    const ok = await post(base, { civs: ["china/tang#cn:glm"], task: "t", backend: "native" });
    assert.equal(ok.status, 202, "known backends still pass");
    assert.equal(calls.length, 1);
  });
});

// Codex re-review P2: the API matched BACKEND_COMMANDS keys exactly while
// engine/v5/backends.mjs::resolveBackend also tries the lowercased id, so the
// API rejected runs the engine would have accepted.
test("backend ids are matched case-insensitively, like the engine resolver", async () => {
  await withWriteServer(async (base, calls) => {
    assert.equal((await post(base, { civs: ["china/tang"], task: "t", backend: "NATIVE" })).status, 202);
    assert.equal((await post(base, { civs: ["china/tang#CN:GLM"], task: "t" })).status, 202);
    assert.equal(calls.length, 2);
    // …and an id that is unknown in any casing is still rejected.
    assert.equal((await post(base, { civs: ["china/tang"], task: "t", backend: "BOGUS" })).status, 400);
    assert.equal(calls.length, 2, "nothing spawned for the unknown backend");
  });
});

test("POST answers 500 (not a crash) when spawn itself throws", async () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-writeapi-"));
  const throwingSpawn = () => { throw new Error("EMFILE"); };
  const server = await listen(makeApp({ spawnFn: throwingSpawn, rootDir }));
  try {
    const { port } = server.address();
    const res = await post(`http://127.0.0.1:${port}`, { civs: ["china/tang"], task: "t" });
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.match(body.error, /EMFILE/);
  } finally {
    server.close();
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("GET /api/tournaments lists fixture manifests from the injected rootDir", async () => {
  await withWriteServer(async (base, _calls, rootDir) => {
    const tDir = path.join(rootDir, "tournaments", "2026-07-29T00-00-00-000-test");
    fs.mkdirSync(tDir, { recursive: true });
    fs.writeFileSync(path.join(tDir, "manifest.json"), JSON.stringify({ id: "x", task: "t", civs: [] }));
    fs.writeFileSync(path.join(tDir, "result.md"), "# result");

    const res = await fetch(`${base}/api/tournaments`);
    assert.equal(res.status, 200);
    const list = await res.json();
    assert.equal(list.length, 1);
    assert.equal(list[0].id, "2026-07-29T00-00-00-000-test");
    assert.equal(list[0].judgeResult, "# result");
  });
});

test("GET /api/tournaments/:id rejects traversal ids and 404s unknown ids", async () => {
  await withWriteServer(async (base) => {
    // Express normalizes a literal ".." out of the path before routing (404);
    // an id with an embedded dot reaches the handler and must hit safeResolve.
    const bad = await fetch(`${base}/api/tournaments/evil.id`);
    assert.equal(bad.status, 400);
    const traversal = await fetch(`${base}/api/tournaments/%2e%2e`);
    assert.ok([400, 404].includes(traversal.status), "encoded traversal never reads outside the root");
    const missing = await fetch(`${base}/api/tournaments/no-such-tournament`);
    assert.equal(missing.status, 404);
  });
});
