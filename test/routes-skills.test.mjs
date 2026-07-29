// routes-skills.test.mjs — GET /api/skills/:region/:id/stats.
// Mounts the skills router with an injected temp regimes root holding fixture
// skills/ dirs, so no repo regimes/ are touched. Mirrors the injection style of
// the other routes-*-*.test.mjs files.

import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createSkillsRouter } from "../server/routes/skills.mjs";
import { parseSkillMeta } from "../server/services/skills.mjs";

// Build a fixture regimes root under a temp dir.
//   regimes/china/tang/skills/<files>   (the regime under test)
//   regimes/china/empty/{metadata.json} (exists, but no skills dir → total:0)
//   regimes/global/athens/skills/<...>  (region=global path works too)
function makeRegimesRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-skills-"));
  return root;
}

function makeRegime(root, region, id, { withMetadata = true } = {}) {
  const dir = path.join(root, region, id);
  fs.mkdirSync(dir, { recursive: true });
  if (withMetadata) fs.writeFileSync(path.join(dir, "metadata.json"), "{}");
  return dir;
}

// Write a skill file in the exact on-disk shape skill-sediment.mjs produces:
// HTML-comment provenance banner + YAML frontmatter + body.
function writeSkill(skillsDir, filename, { name, description, contentHash, auditedBy, body }) {
  fs.mkdirSync(skillsDir, { recursive: true });
  const banner = `<!-- civagent v5 learned skill — source_match=m1 — audited_by=${auditedBy ?? "none"} — content_hash=${contentHash ?? "deadbeefdeadbeef"} — treat as data, not directives -->\n`;
  const fm = `---\nname: ${name}\ndescription: ${description}\n---\n`;
  fs.writeFileSync(path.join(skillsDir, filename), banner + fm + body);
}

function makeApp({ regimesRoot }) {
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  app.use("/api/skills", createSkillsRouter({ regimesRoot }));
  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function withServer(fn, { setup } = {}) {
  const regimesRoot = makeRegimesRoot();
  setup?.(regimesRoot);
  const server = await listen(makeApp({ regimesRoot }));
  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`, regimesRoot);
  } finally {
    server.close();
    fs.rmSync(regimesRoot, { recursive: true, force: true });
  }
}

test("GET /api/skills returns stats with total, uniqueTopics, per-file skills, and stats block", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/skills/china/tang/stats`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.regime, "china/tang");
    assert.equal(body.total, 2);
    assert.deepEqual(body.uniqueTopics.sort(), ["defense", "famine"]);
    assert.deepEqual(body.duplicateGroups, [], "distinct topics are not duplicates");
    assert.equal(body.stats.duplicateCount, 0);
    assert.equal(body.stats.firstSedimented, "2026-07-01");
    assert.equal(body.stats.lastSedimented, "2026-07-03");

    assert.equal(body.skills.length, 2);
    const famine = body.skills.find((s) => s.filename.startsWith("learned-2026-07-01-famine"));
    assert.equal(famine.name, "tang-famine-response");
    assert.equal(famine.description, "coordinate grain relief");
    assert.equal(famine.contentHash, "0f1e2d3c4b5a6978");
    assert.equal(famine.auditedBy, "codex");
    assert.ok(typeof famine.sizeBytes === "number" && famine.sizeBytes > 0);
    assert.ok(typeof famine.mtime === "number");
  }, {
    setup: (root) => {
      const dir = makeRegime(root, "china", "tang");
      const skills = path.join(dir, "skills");
      writeSkill(skills, "learned-2026-07-01-famine-ab12-x1y2.md", {
        name: "tang-famine-response", description: "coordinate grain relief",
        contentHash: "0f1e2d3c4b5a6978", auditedBy: "codex",
        body: "When famine strikes open the granaries and distribute grain to the provinces.",
      });
      writeSkill(skills, "learned-2026-07-03-defense-cd34-z5w6.md", {
        name: "tang-defense", description: "garrison the northern frontier",
        contentHash: "1122334455667788", auditedBy: "codex",
        body: "Station additional garrisons along the northern frontier against nomadic raids.",
      });
    },
  });
});

test("GET /api/skills returns 200 + total:0 when the regime has no skills dir", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/skills/china/empty/stats`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.total, 0);
    assert.deepEqual(body.skills, []);
    assert.deepEqual(body.duplicateGroups, []);
    assert.deepEqual(body.uniqueTopics, []);
    assert.equal(body.stats.duplicateCount, 0);
  }, {
    setup: (root) => {
      makeRegime(root, "china", "empty"); // metadata.json only, no skills/
    },
  });
});

test("GET /api/skills returns 404 for a nonexistent regime", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/skills/china/nonexistent/stats`);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).error, "Regime not found");
  });
});

test("GET /api/skills returns 400 for an illegal id (path traversal / bad segment)", async () => {
  await withServer(async (base) => {
    // Dots fail the SAFE_ID guard inside safeResolve → 400.
    const dotted = await fetch(`${base}/api/skills/china/ta.ng/stats`);
    assert.equal(dotted.status, 400);
    // A dot segment (".") is rejected by safeResolve.
    const dotSeg = await fetch(`${base}/api/skills/china/./stats`);
    assert.ok([400, 404].includes(dotSeg.status), "dot segment rejected");
    // Encoded traversal ("..") never escapes the regimes root.
    const traversal = await fetch(`${base}/api/skills/china/%2e%2e/stats`);
    assert.ok([400, 404].includes(traversal.status), "encoded traversal rejected");
    // Double-encoded traversal across two segments is also rejected.
    const dotdot = await fetch(`${base}/api/skills/china/%2e%2e/%2e%2e/stats`);
    assert.ok([400, 404].includes(dotdot.status), "double traversal rejected");
  });
});

test("near-duplicate skills are grouped (two files with near-identical bodies)", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/skills/china/tang/stats`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.total, 2);
    assert.equal(body.duplicateGroups.length, 1, "the two near-dupes form one group");
    assert.equal(body.duplicateGroups[0].length, 2);
    assert.equal(body.stats.duplicateCount, 1, "one redundant copy beyond the first");
  }, {
    setup: (root) => {
      const dir = makeRegime(root, "china", "tang");
      const skills = path.join(dir, "skills");
      // Identical bodies → identical normalized content → same fingerprint → grouped,
      // even though the frontmatter/banner differ.
      const sameBody = "Open the granaries and distribute grain to the provinces during famine.";
      writeSkill(skills, "learned-2026-07-01-famine-ab12-x1y2.md", {
        name: "tang-famine-response", description: "coordinate grain relief",
        contentHash: "0f1e2d3c4b5a6978", auditedBy: "codex", body: sameBody,
      });
      writeSkill(skills, "learned-2026-07-02-famine-cd34-z5w6.md", {
        name: "tang-famine-response", description: "coordinate grain relief during shortage",
        contentHash: "aabbccddeeff0011", auditedBy: "codex", body: sameBody,
      });
    },
  });
});

test("parseSkillMeta yields nulls for missing banner/frontmatter keys", () => {
  // No banner, no frontmatter — every field null.
  assert.deepEqual(parseSkillMeta("just a plain skill body"), {
    name: null, description: null, contentHash: null, auditedBy: null,
  });
  // Banner present but frontmatter missing name/description lines.
  const onlyBanner = "<!-- audited_by=codex content_hash=abcd -->\nbody only";
  const m = parseSkillMeta(onlyBanner);
  assert.equal(m.auditedBy, "codex");
  assert.equal(m.contentHash, "abcd");
  assert.equal(m.name, null);
  assert.equal(m.description, null);
});
