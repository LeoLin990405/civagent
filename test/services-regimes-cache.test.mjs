// services-regimes-cache.test.mjs — cache correctness for the regime catalog.
//
// Codex review R5 P1(1 on PR #30): the first cut keyed the cache on the root
// regimes/ directory mtime. A parent directory's mtime does not change when a
// nested file is edited in place, so an edited IDENTITY.md/SOUL.md/metadata.json
// was served stale for the life of the process. These tests pin the invalidation
// contract against real filesystem mutations.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  listRegimes,
  listRegimeSummaries,
  invalidateRegimeCache,
} from "../server/services/regimes.mjs";

function makeTree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-regimes-"));
  const dir = path.join(root, "china", "probe");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify({
    id: "probe", name: { zh: "探针", en: "Probe" }, era: { zh: "无", en: "none" },
    system: { zh: "无", en: "none" }, description: { zh: "x", en: "x" },
    orchestrationPattern: "centralized", agentCount: 1,
  }));
  fs.writeFileSync(path.join(dir, "IDENTITY.md"), "# Identity v1\n");
  fs.writeFileSync(path.join(dir, "SOUL.md"), "# Soul v1\n");
  return { root, dir };
}

function withTree(fn) {
  const { root, dir } = makeTree();
  try {
    fn(root, dir);
  } finally {
    invalidateRegimeCache(root);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("an in-place edit to a nested file invalidates the cache", () => {
  withTree((root, dir) => {
    assert.match(listRegimes(root)[0].soul, /Soul v1/);
    fs.writeFileSync(path.join(dir, "SOUL.md"), "# Soul v2 — edited in place\n");
    assert.match(listRegimes(root)[0].soul, /Soul v2/, "nested edit must not be served stale");
  });
});

test("editing metadata.json is reflected in both full and summary views", () => {
  withTree((root, dir) => {
    assert.equal(listRegimes(root)[0].metadata.agentCount, 1);
    assert.equal(listRegimeSummaries(root)[0].metadata.agentCount, 1);
    const meta = JSON.parse(fs.readFileSync(path.join(dir, "metadata.json"), "utf8"));
    meta.agentCount = 7;
    fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify(meta));
    assert.equal(listRegimes(root)[0].metadata.agentCount, 7);
    assert.equal(listRegimeSummaries(root)[0].metadata.agentCount, 7);
  });
});

test("adding and removing a skill file invalidates the cache", () => {
  withTree((root, dir) => {
    assert.equal(listRegimes(root)[0].skills.length, 0);
    const skillsDir = path.join(dir, "skills");
    fs.mkdirSync(skillsDir);
    const f = path.join(skillsDir, "learned-2026-07-29-probe-aaaaaa-zzzz.md");
    fs.writeFileSync(f, "---\nname: probe\n---\nbody\n");
    assert.equal(listRegimes(root)[0].skills.length, 1, "added skill must appear");
    fs.rmSync(f);
    assert.equal(listRegimes(root)[0].skills.length, 0, "removed skill must disappear");
  });
});

test("adding a whole regime invalidates the cache", () => {
  withTree((root) => {
    assert.equal(listRegimeSummaries(root).length, 1);
    const d2 = path.join(root, "global", "probe2");
    fs.mkdirSync(d2, { recursive: true });
    fs.writeFileSync(path.join(d2, "metadata.json"), JSON.stringify({ id: "probe2", agentCount: 2 }));
    assert.equal(listRegimeSummaries(root).length, 2);
  });
});

test("an unchanged tree is served from cache (same object identity)", () => {
  withTree((root) => {
    const a = listRegimes(root);
    const b = listRegimes(root);
    assert.equal(a, b, "no filesystem change → the cached array itself is reused");
  });
});

// Codex review R5 P2(1 on PR #30): summary mode was response-light but not
// I/O-light — a cold cache still read every markdown body and then mapped it
// away. The bodies must not be touched unless the full catalog is requested.
test("summary mode never reads the markdown bodies, even on a cold cache", () => {
  withTree((root, dir) => {
    invalidateRegimeCache(root);
    const read = [];
    const realRead = fs.readFileSync;
    fs.readFileSync = (p, ...rest) => { read.push(String(p)); return realRead(p, ...rest); };
    try {
      listRegimeSummaries(root);
    } finally {
      fs.readFileSync = realRead;
    }
    assert.ok(read.some((p) => p.endsWith("metadata.json")), "metadata is read");
    assert.ok(
      !read.some((p) => p.endsWith("IDENTITY.md") || p.endsWith("SOUL.md")),
      `summary must not read bodies, but read: ${read.filter((p) => p.endsWith(".md")).join(", ")}`,
    );
    // …and asking for the full catalog afterwards still returns the bodies.
    assert.match(listRegimes(root)[0].identity, /Identity v1/);
    assert.ok(dir);
  });
});
