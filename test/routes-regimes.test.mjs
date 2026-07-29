// routes-regimes.test.mjs — GET /api/regimes (full + ?summary=1) and the per-
// regime detail endpoints. Mounts the regimes router with an injected temp
// project root holding a fixture regimes/ tree, so no repo regimes/ are touched.
// Mirrors the tournaments-write-api.test.mjs injection style.

import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRegimesRouter } from "../server/routes/regimes.mjs";
import { invalidateRegimeCache } from "../server/services/regimes.mjs";

// Build a fixture regimes tree under a temp project root:
//   regimes/china/tang/{metadata.json, IDENTITY.md, SOUL.md, skills/x.md}
//   regimes/china/qin/{metadata.json, IDENTITY.md}
//   regimes/_private/...   (must be skipped — starts with '_')
//   regimes/.hidden/...    (must be skipped — starts with '.')
function makeProjectRoot() {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-regimes-"));
  const regimes = path.join(projectRoot, "regimes");

  const tang = path.join(regimes, "china", "tang");
  fs.mkdirSync(path.join(tang, "skills"), { recursive: true });
  fs.writeFileSync(path.join(tang, "metadata.json"), JSON.stringify({ name: { zh: "唐", en: "Tang" }, agentCount: 9, mechanisms: ["veto"] }));
  fs.writeFileSync(path.join(tang, "IDENTITY.md"), "# Tang identity");
  fs.writeFileSync(path.join(tang, "SOUL.md"), "# Tang soul");
  fs.writeFileSync(path.join(tang, "skills", "rice.md"), "rice skill");

  const qin = path.join(regimes, "china", "qin");
  fs.mkdirSync(qin, { recursive: true });
  fs.writeFileSync(path.join(qin, "metadata.json"), JSON.stringify({ name: { zh: "秦", en: "Qin" }, agentCount: 6 }));
  fs.writeFileSync(path.join(qin, "IDENTITY.md"), "# Qin identity");

  // Private/template dirs must be excluded from the walk.
  fs.mkdirSync(path.join(regimes, "_private", "p"), { recursive: true });
  fs.writeFileSync(path.join(regimes, "_private", "p", "metadata.json"), "{}");
  fs.mkdirSync(path.join(regimes, ".hidden", "h"), { recursive: true });
  fs.writeFileSync(path.join(regimes, ".hidden", "h", "metadata.json"), "{}");

  return projectRoot;
}

function makeApp({ projectRoot }) {
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  app.use("/api/regimes", createRegimesRouter({ projectRoot }));
  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function withServer(fn) {
  const projectRoot = makeProjectRoot();
  const server = await listen(makeApp({ projectRoot }));
  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`, projectRoot);
  } finally {
    server.close();
    invalidateRegimeCache(); // drop any cache entry so tests don't bleed into each other
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

test("GET /api/regimes lists the fixture regimes with full bodies", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/regimes`);
    assert.equal(res.status, 200);
    const body = await res.json();
    const ids = body.map((r) => r.id).sort();
    assert.deepEqual(ids, ["china/qin", "china/tang"], "private/hidden dirs excluded");

    const tang = body.find((r) => r.id === "china/tang");
    assert.equal(tang.metadata.agentCount, 9);
    assert.equal(tang.identity, "# Tang identity");
    assert.equal(tang.soul, "# Tang soul");
    assert.equal(tang.skills.length, 1);
    assert.equal(tang.skills[0].filename, "rice.md");
    assert.equal(tang.skills[0].content, "rice skill");

    const qin = body.find((r) => r.id === "china/qin");
    assert.equal(qin.soul, "", "missing SOUL.md yields empty string");
    assert.deepEqual(qin.skills, [], "no skills dir yields empty array");
  });
});

test("GET /api/regimes?summary=1 omits the markdown bodies", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/regimes?summary=1`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.length, 2);
    const tang = body.find((r) => r.id === "china/tang");
    // Summary entries carry only id + metadata — no identity/soul/skills.
    assert.deepEqual(Object.keys(tang).sort(), ["id", "metadata"]);
    assert.equal(tang.metadata.agentCount, 9);
  });
});

test("GET /api/regimes/:region/:id/identity returns the raw markdown", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/regimes/china/tang/identity`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, "tang");
    assert.equal(body.region, "china");
    assert.equal(body.raw, "# Tang identity");
  });
});

test("GET /api/regimes/:region/:id/identity serves a regime with no SOUL.md", async () => {
  await withServer(async (base) => {
    // qin has an IDENTITY.md but no SOUL.md — identity endpoint still works.
    const res = await fetch(`${base}/api/regimes/china/qin/identity`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).raw, "# Qin identity");
  });
});

test("GET /api/regimes/:region/:id/mechanisms returns the metadata mechanisms array", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/regimes/china/tang/mechanisms`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, "tang");
    assert.equal(body.region, "china");
    assert.deepEqual(body.mechanisms, ["veto"]);
  });
});

test("GET /api/regimes/:region/:id/mechanisms 404s an unknown regime", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/regimes/china/ghost/mechanisms`);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).error, "Regime metadata not found");
  });
});

test("invalid regime id segment is rejected (path-safety → 400)", async () => {
  await withServer(async (base) => {
    // A dot in the id fails the SAFE_ID guard inside safeResolve.
    const res = await fetch(`${base}/api/regimes/china/ta.ng/mechanisms`);
    assert.equal(res.status, 400);
  });
});

// This test previously asserted the opposite — that an edited IDENTITY.md kept
// being served from cache — which locked in the root-mtime keying bug the R5
// review found (a nested edit never changes the parent dir's mtime, so the
// stale body was served for the life of the process). The cache is now keyed by
// a recursive fingerprint over the served files, so a caller must never observe
// a stale regime; see test/services-regimes-cache.test.mjs for the full matrix.
test("GET /api/regimes reflects an in-place edit to a nested regime file", async () => {
  await withServer(async (base, projectRoot) => {
    const first = await fetch(`${base}/api/regimes`);
    assert.equal(first.status, 200);
    const firstBody = await first.json();
    assert.equal(firstBody.length, 2);
    assert.equal(firstBody.find((r) => r.id === "china/tang").identity, "# Tang identity");

    // Editing a nested file leaves the regimes/ dir mtime untouched.
    fs.writeFileSync(path.join(projectRoot, "regimes", "china", "tang", "IDENTITY.md"), "# CHANGED");

    const second = await fetch(`${base}/api/regimes`);
    const tang = (await second.json()).find((r) => r.id === "china/tang");
    assert.equal(tang.identity, "# CHANGED", "an edited regime must not be served stale");
  });
});

test("GET /api/regimes serves the cache when nothing on disk changed", async () => {
  await withServer(async (base) => {
    invalidateRegimeCache();
    const a = await (await fetch(`${base}/api/regimes`)).json();
    const b = await (await fetch(`${base}/api/regimes`)).json();
    assert.deepEqual(a, b, "repeat reads of an unchanged tree are identical");
  });
});
