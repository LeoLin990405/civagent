// regime-to-cc.test.mjs — the IDENTITY.md → CC agents compiler.
// parseIdentityTable is the highest-risk parser in the repo: a malformed
// IDENTITY.md silently compiles to 0 agents (AGENTS.md hard rule #2), which
// bricks the regime without any error. These tests pin its contract.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseIdentityTable, convertRegime } from "../engine/regime-to-cc.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const GOOD_TABLE = `# Some Regime

## Role Mapping

| Historical Role | Agent ID | AI Responsibility | Recommended Model |
|---|---|---|---|
| Emperor | \`huangdi\` | Coordinator | strong |
| Chancellor | \`zaixiang\` | Review | strong |
| Scribe | \`shiguan\` | Documentation | fast |

## Other Section
`;

test("parseIdentityTable extracts every row of a well-formed table", () => {
  const agents = parseIdentityTable(GOOD_TABLE);
  assert.equal(agents.length, 3);
  assert.deepEqual(agents.map((a) => a.agentId), ["huangdi", "zaixiang", "shiguan"]);
  assert.equal(agents[0].historicalRole, "Emperor");
  assert.equal(agents[0].aiRole, "Coordinator");
  assert.equal(agents[0].modelHint, "strong");
});

test("parseIdentityTable strips backticks from agent ids", () => {
  const agents = parseIdentityTable(GOOD_TABLE);
  for (const a of agents) assert.ok(!a.agentId.includes("`"), a.agentId);
});

test("parseIdentityTable skips the separator row", () => {
  const agents = parseIdentityTable(GOOD_TABLE);
  assert.ok(!agents.some((a) => a.historicalRole.startsWith("-")), "no separator rows leaked");
});

test("parseIdentityTable stops at the first non-table line after the table", () => {
  const md = GOOD_TABLE + `\n| Straggler | \`late\` | Should not parse | fast |\n`;
  // The "## Other Section" line ended the table; a later pipe-line without a
  // new "Agent ID" header must not be swallowed in.
  const agents = parseIdentityTable(md);
  assert.equal(agents.length, 3);
});

test("prose-style IDENTITY (### Agent headings + bullets) compiles to 0 agents — the documented hazard", () => {
  const prose = `# Regime\n\n### Agent 1: The King\n- Role: coordinator\n- Model: strong\n\n### Agent 2: The Priest\n- Role: review\n`;
  const agents = parseIdentityTable(prose);
  assert.equal(agents.length, 0, "prose format must parse to zero (this is why hard rule #2 exists)");
});

test("a table without the Agent ID header column parses to 0 agents", () => {
  const md = `| Role | Who | What |\n|---|---|---|\n| Emperor | huangdi | rules |\n`;
  assert.equal(parseIdentityTable(md).length, 0);
});

test("rows with fewer than 3 cells are ignored", () => {
  const md = `| Historical Role | Agent ID | AI Responsibility |\n|---|---|---|\n| OnlyTwo | \`x\` |\n| Full | \`y\` | works |\n`;
  const agents = parseIdentityTable(md);
  assert.deepEqual(agents.map((a) => a.agentId), ["y"]);
});

test("every tracked regime parses to at least 1 agent (no silently bricked regime)", () => {
  const regimesDir = path.join(PROJECT_ROOT, "regimes");
  let checked = 0;
  for (const region of ["china", "global"]) {
    for (const id of fs.readdirSync(path.join(regimesDir, region))) {
      if (id.startsWith("_") || id.startsWith(".")) continue;
      const identityPath = path.join(regimesDir, region, id, "IDENTITY.md");
      if (!fs.existsSync(identityPath)) continue;
      const agents = parseIdentityTable(fs.readFileSync(identityPath, "utf8"));
      assert.ok(agents.length > 0, `${region}/${id}: IDENTITY.md parses to 0 agents`);
      checked++;
    }
  }
  assert.equal(checked, 57, "all 57 regimes checked");
});

test("convertRegime compiles china/tang into agents JSON matching its metadata agentCount", () => {
  const regimeDir = path.join(PROJECT_ROOT, "regimes", "china", "tang");
  const { agents, metadata } = convertRegime(regimeDir);
  const ids = Object.keys(agents);
  assert.equal(ids.length, metadata.agentCount, "compiled agent count matches metadata.agentCount");
  assert.ok(ids.includes("zhongshu") && ids.includes("menxia") && ids.includes("shangshu"), "三省 agents present");
});

test("convertRegime on a temp regime with prose IDENTITY yields 0 agents (not a crash)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "civagent-r2cc-"));
  try {
    fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify({
      id: "test", name: { zh: "测试", en: "Test" }, era: { zh: "无", en: "none" },
      system: { zh: "无", en: "none" }, description: { zh: "x", en: "x" },
      orchestrationPattern: "centralized", agentCount: 2,
    }));
    fs.writeFileSync(path.join(dir, "IDENTITY.md"), "### Agent 1: The King\n- Role: coordinator\n");
    fs.writeFileSync(path.join(dir, "SOUL.md"), "# Soul\n");
    const { agents } = convertRegime(dir);
    assert.equal(Object.keys(agents).length, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
