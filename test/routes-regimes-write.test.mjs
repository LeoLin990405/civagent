// routes-regimes-write.test.mjs — PUT /api/regimes/:region/:id (regime edits).
//
// Hermetic: every test builds a temp regimes root, mounts the regimes router
// pointed at it, and exercises the write endpoint + the read cache. The real
// regimes/ tree is never touched. Mirrors the R5/R6 routes-*-*.test.mjs style.

import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRegimesRouter } from "../server/routes/regimes.mjs";
import { invalidateRegimeCache } from "../server/services/regimes.mjs";
import { updateRegimeFiles } from "../server/services/regime-write.mjs";

// ── Fixture builders ──────────────────────────────────────────────────────────

// A minimal but engine-valid IDENTITY.md role table. agentIds must match the
// topology nodes for the athens-style regime.
function identityMd(agentIds) {
  const rows = agentIds
    .map((id, i) => `| Role ${i + 1} | \`${id}\` | manages domain ${i + 1} | fast |`)
    .join("\n");
  return `# Regime Identity\n\n| Historical Role | Agent ID | AI Duty | Model |\n|---|---|---|---|\n${rows}\n`;
}

// Build a regime directory under <root>/regimes/<region>/<id>. `root` is the
// project root (parent of regimes/), matching how the router resolves it.
function makeRegime(root, region, id, opts = {}) {
  const dir = path.join(root, "regimes", region, id);
  fs.mkdirSync(dir, { recursive: true });
  const agentIds = opts.agentIds ?? ["alpha", "beta"];
  const metadata = {
    id,
    region,
    name: { zh: id, en: id },
    agentCount: agentIds.length,
    orchestrationPattern: opts.pattern ?? "centralized",
    ...(opts.metadata ?? {}),
  };
  fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify(metadata, null, 2));
  fs.writeFileSync(path.join(dir, "IDENTITY.md"), identityMd(agentIds));
  fs.writeFileSync(path.join(dir, "SOUL.md"), opts.soul ?? "original soul");
  if (opts.topology) fs.writeFileSync(path.join(dir, "topology.json"), JSON.stringify(opts.topology, null, 2));
  return dir;
}

// An athens-style topology whose nodes must match the IDENTITY agent ids.
// Convenience: absolute path to a fixture regime dir under <root>/regimes.
function regimeDir(root, region, id) {
  return path.join(root, "regimes", region, id);
}

function topology(agentIds, { mode = "democratic" } = {}) {
  return {
    schema_version: "1.0",
    regime: "global/athens-like",
    mode,
    nodes: agentIds.map((id, i) => ({ id, label: `node ${i}`, functional_role: "coordinator" })),
    edges: agentIds.length > 1 ? [{ from: agentIds[0], to: agentIds[1], kind: "command", note: "x" }] : [],
  };
}

function makeApp({ regimesRoot }) {
  const app = express();
  app.use(express.json({ limit: "256kb" }));
  // regimesRoot is the project root; the regimes/ tree lives under it.
  app.use("/api/regimes", createRegimesRouter({ projectRoot: regimesRoot }));
  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

// Each test gets a fresh temp root + server, torn down after.
async function withServer(fn, { setup } = {}) {
  const regimesRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-rw-regimes-"));
  setup?.(regimesRoot);
  const server = await listen(makeApp({ regimesRoot }));
  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`, regimesRoot);
  } finally {
    server.close();
    invalidateRegimeCache(); // drop cache so tests never bleed
    fs.rmSync(regimesRoot, { recursive: true, force: true });
  }
}

function put(base, region, id, body) {
  return fetch(`${base}/api/regimes/${region}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Happy path: SOUL edit round-trips and the read cache sees it ──────────────

test("PUT updates SOUL.md → 200, disk changes, GET /api/regimes reflects it (cache invalidated)", async () => {
  await withServer(async (base, root) => {
    // Warm the read cache with the original state.
    const before = await (await fetch(`${base}/api/regimes`)).json();
    assert.equal(before.find((r) => r.id === "china/tang").soul, "original soul");

    const res = await put(base, "china", "tang", { soul: "revised soul content" });
    assert.equal(res.status, 200);
    const summary = await res.json();
    assert.equal(summary.regime, "china/tang");
    assert.equal(summary.agentCount, 2);
    assert.deepEqual(summary.updated, ["SOUL.md"]);

    // Disk changed.
    assert.equal(fs.readFileSync(path.join(regimeDir(root, "china", "tang"), "SOUL.md"), "utf8"), "revised soul content");

    // The read endpoint sees the new value immediately (cache was invalidated).
    const after = await (await fetch(`${base}/api/regimes`)).json();
    assert.equal(after.find((r) => r.id === "china/tang").soul, "revised soul content");
  }, {
    setup: (root) => makeRegime(root, "china", "tang"),
  });
});

// ── The headline hazard: prose IDENTITY is rejected AND disk is untouched ────

test("PUT with a prose (table-less) IDENTITY → 400 and the original file is byte-identical", async () => {
  await withServer(async (base, root) => {
    const idPath = path.join(regimeDir(root, "china", "tang"), "IDENTITY.md");
    const original = fs.readFileSync(idPath, "utf8");

    const res = await put(base, "china", "tang", {
      identity: "### Agent 1: The Emperor\n- decides everything\n### Agent 2: The Minister\n- advises",
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(Array.isArray(body.findings) && body.findings.length > 0);
    assert.match(body.findings.join(" "), /0 agents|role-mapping/i);

    // CRITICAL: nothing was written.
    assert.equal(fs.readFileSync(idPath, "utf8"), original, "original IDENTITY.md untouched");
  }, {
    setup: (root) => makeRegime(root, "china", "tang"),
  });
});

// ── agentCount auto-sync ──────────────────────────────────────────────────────

test("PUT that changes the IDENTITY table resyncs metadata.agentCount", async () => {
  await withServer(async (base, root) => {
    // Start with 2 agents; rewrite the table to 3.
    const res = await put(base, "china", "tang", {
      metadata: { orchestrationPattern: "centralized" }, // payload omits agentCount on purpose
      identity: identityMd(["alpha", "beta", "gamma"]),
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).agentCount, 3);

    const meta = JSON.parse(fs.readFileSync(path.join(regimeDir(root, "china", "tang"), "metadata.json"), "utf8"));
    assert.equal(meta.agentCount, 3, "on-disk agentCount was auto-synced to the compiled count");
  }, {
    setup: (root) => makeRegime(root, "china", "tang", { agentIds: ["alpha", "beta"] }),
  });
});

// The case above always sends a metadata payload, so metadata.json gets written
// for that reason alone. Editing ONLY the IDENTITY table still changes the
// compiled agent count, and the on-disk metadata has to follow — otherwise the
// regime violates AGENTS.md rule #3 and `npm run validate:regimes` fails on the
// next run even though the API answered 200.
test("editing ONLY IDENTITY still writes the resynced agentCount to disk", async () => {
  await withServer(async (base, root) => {
    const res = await put(base, "china", "tang", {
      identity: identityMd(["alpha", "beta", "gamma"]), // no metadata in the payload
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.agentCount, 3);
    assert.ok(body.updated.includes("metadata.json"), `metadata.json must be rewritten, got ${body.updated}`);

    const meta = JSON.parse(fs.readFileSync(path.join(regimeDir(root, "china", "tang"), "metadata.json"), "utf8"));
    assert.equal(meta.agentCount, 3, "on-disk agentCount must match the compiled count, not just the response");
  }, {
    setup: (root) => makeRegime(root, "china", "tang", { agentIds: ["alpha", "beta"] }),
  });
});

test("an edit that leaves the agent count alone does not rewrite metadata.json", async () => {
  await withServer(async (base, root) => {
    const res = await put(base, "china", "tang", { soul: "# Soul v2\n" });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.updated, ["SOUL.md"], "no gratuitous metadata rewrite");
    assert.ok(root);
  }, {
    setup: (root) => makeRegime(root, "china", "tang", { agentIds: ["alpha", "beta"] }),
  });
});

test("PUT does NOT trust a payload agentCount that contradicts the table", async () => {
  await withServer(async (base, root) => {
    const res = await put(base, "china", "tang", {
      metadata: { agentCount: 99, orchestrationPattern: "centralized" }, // wrong on purpose
    });
    assert.equal(res.status, 200);
    const meta = JSON.parse(fs.readFileSync(path.join(regimeDir(root, "china", "tang"), "metadata.json"), "utf8"));
    assert.equal(meta.agentCount, 2, "payload agentCount=99 overridden by the real compiled count");
  }, {
    setup: (root) => makeRegime(root, "china", "tang", { agentIds: ["alpha", "beta"] }),
  });
});

// ── Path safety: bad id / traversal ──────────────────────────────────────────

test("PUT rejects an illegal id (400)", async () => {
  await withServer(async (base) => {
    const res = await put(base, "china", "TA.NG", { soul: "x" });
    assert.equal(res.status, 400);
  });
});

test("PUT rejects a non-whitelisted region (400)", async () => {
  await withServer(async (base) => {
    const res = await put(base, "atlantis", "lost", { soul: "x" });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.findings.join(" "), /invalid regime id/i);
  });
});

test("PUT rejects encoded path traversal (400, never escapes the root)", async () => {
  await withServer(async (base, root) => {
    const secret = path.join(path.dirname(root), "secret.txt");
    fs.writeFileSync(secret, "top secret");
    try {
      const res = await fetch(`${base}/api/regimes/china/%2e%2e%2f%2e%2e`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soul: "stolen" }),
      });
      assert.ok([400, 404].includes(res.status), "traversal never writes outside the root");
      assert.equal(fs.readFileSync(secret, "utf8"), "top secret", "file outside root untouched");
    } finally {
      fs.rmSync(secret, { force: true });
    }
  }, {
    setup: (root) => makeRegime(root, "china", "tang"),
  });
});

// ── 404: edit-only ────────────────────────────────────────────────────────────

test("PUT on a nonexistent regime → 404 (edit-only, no create)", async () => {
  await withServer(async (base, root) => {
    makeRegime(root, "china", "tang"); // only tang exists
    const res = await put(base, "china", "ghost", { soul: "x" });
    assert.equal(res.status, 404);
  });
});

// ── metadata.json syntax ──────────────────────────────────────────────────────

test("PUT with malformed metadata JSON → 400", async () => {
  await withServer(async (base) => {
    const res = await put(base, "china", "tang", { metadata: "{ not valid json" });
    assert.equal(res.status, 400);
    assert.match((await res.json()).findings.join(" "), /not valid JSON/i);
  }, {
    setup: (root) => makeRegime(root, "china", "tang"),
  });
});

// ── Atomicity: a partial failure writes NOTHING ───────────────────────────────

test("PUT updating multiple files where IDENTITY is invalid → 400 and ALL files untouched", async () => {
  await withServer(async (base, root) => {
    const dir = regimeDir(root, "china", "tang");
    const meta0 = fs.readFileSync(path.join(dir, "metadata.json"), "utf8");
    const id0 = fs.readFileSync(path.join(dir, "IDENTITY.md"), "utf8");
    const soul0 = fs.readFileSync(path.join(dir, "SOUL.md"), "utf8");

    // A valid metadata + a valid SOUL, but a prose (0-agent) IDENTITY.
    const res = await put(base, "china", "tang", {
      metadata: { orchestrationPattern: "centralized" },
      soul: "new soul that should NOT land",
      identity: "### Agent 1\n- prose only, no table",
    });
    assert.equal(res.status, 400);

    // Every file is byte-identical to before — the whole batch was rejected.
    assert.equal(fs.readFileSync(path.join(dir, "metadata.json"), "utf8"), meta0);
    assert.equal(fs.readFileSync(path.join(dir, "IDENTITY.md"), "utf8"), id0);
    assert.equal(fs.readFileSync(path.join(dir, "SOUL.md"), "utf8"), soul0);
  }, {
    setup: (root) => makeRegime(root, "china", "tang"),
  });
});

// ── Topology cross-check ──────────────────────────────────────────────────────

test("PUT keeps a topology regime valid when the IDENTITY still matches the nodes", async () => {
  await withServer(async (base, root) => {
    const ids = ["ekklesia", "boule", "strategos"];
    makeRegime(root, "global", "athens-like", {
      agentIds: ids,
      pattern: "democratic",
      topology: topology(ids, { mode: "democratic" }),
    });
    const res = await put(base, "global", "athens-like", { soul: "new soul" });
    assert.equal(res.status, 200, "soul edit on a valid topology regime succeeds");
  });
});

test("PUT rejects an IDENTITY whose agents no longer match the topology nodes (400)", async () => {
  await withServer(async (base, root) => {
    const ids = ["ekklesia", "boule", "strategos"];
    makeRegime(root, "global", "athens-like", {
      agentIds: ids,
      pattern: "democratic",
      topology: topology(ids, { mode: "democratic" }),
    });
    // Rewrite the table to a DIFFERENT agent set → topology cross-check fails.
    const res = await put(base, "global", "athens-like", {
      identity: identityMd(["someone", "else", "entirely"]),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.findings.length > 0, "topology/identity mismatch surfaced as findings");
    // And nothing was written.
    assert.equal(
      fs.readFileSync(path.join(regimeDir(root, "global", "athens-like"), "IDENTITY.md"), "utf8"),
      identityMd(ids),
      "IDENTITY rolled back / never changed"
    );
  });
});

test("PUT rejects when metadata.orchestrationPattern drifts from topology.mode (400)", async () => {
  await withServer(async (base, root) => {
    const ids = ["ekklesia", "boule"];
    makeRegime(root, "global", "athens-like", {
      agentIds: ids,
      pattern: "democratic",
      topology: topology(ids, { mode: "democratic" }),
    });
    // Propose a pattern that normalizes to a different mode than the topology.
    const res = await put(base, "global", "athens-like", {
      metadata: { orchestrationPattern: "centralized" },
    });
    assert.equal(res.status, 400);
    assert.match((await res.json()).findings.join(" "), /does not match.*orchestrationPattern|mode/i);
  });
});

// ── No-op body ────────────────────────────────────────────────────────────────

test("PUT with no editable fields → 400", async () => {
  await withServer(async (base) => {
    const res = await put(base, "china", "tang", { unrelated: "field" });
    assert.equal(res.status, 400);
  }, {
    setup: (root) => makeRegime(root, "china", "tang"),
  });
});

// ── Direct service unit: atomic rollback on a PARTIAL write failure ───────────
// Exercises the rollback path the happy HTTP path can't trigger: file A writes
// successfully, then file B fails mid-batch. The service must restore A. We force
// the partial failure by making renameSync throw for the SECOND file (SOUL.md)
// while letting the first (metadata.json) land — proving rollback actually
// restores a file that was already overwritten.

test("updateRegimeFiles rolls back already-written files when a later write fails mid-batch", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-rw-rollback-"));
  const regimesDir = path.join(projectRoot, "regimes");
  const origRename = fs.renameSync;
  try {
    const dir = makeRegime(projectRoot, "china", "tang", { agentIds: ["alpha", "beta"] });
    const meta0 = fs.readFileSync(path.join(dir, "metadata.json"), "utf8");
    const soul0 = fs.readFileSync(path.join(dir, "SOUL.md"), "utf8");

    // Writes happen in order [metadata.json, SOUL.md]. Let metadata's rename
    // succeed, but throw on SOUL.md's rename → a genuine partial write.
    fs.renameSync = (src, dest) => {
      if (dest.endsWith("SOUL.md")) throw new Error("simulated mid-batch failure");
      origRename(src, dest);
    };

    const result = updateRegimeFiles(regimesDir, "china", "tang", {
      metadata: { orchestrationPattern: "centralized" },
      soul: "should not land",
    });
    assert.equal(result.ok, false);
    assert.equal(result.status, 500);
    assert.match(result.findings.join(" "), /rolled back/i);

    // metadata.json was overwritten by the first write, then restored by
    // rollback — so it must equal the original again. This is the assertion that
    // proves rollback (not merely "the write failed before touching anything").
    assert.equal(fs.readFileSync(path.join(dir, "metadata.json"), "utf8"), meta0, "metadata.json restored after partial failure");
    assert.equal(fs.readFileSync(path.join(dir, "SOUL.md"), "utf8"), soul0, "SOUL.md untouched");
  } finally {
    fs.renameSync = origRename;
    invalidateRegimeCache();
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
});
