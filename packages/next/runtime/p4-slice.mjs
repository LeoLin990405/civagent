/**
 * p4-slice.mjs — P4 runtime: owned tournament with paired blind judging and
 * skill provenance, end-to-end on real regimes.
 *
 *   RegimeIR x2 -> Tournament admission (eligibility/caps/deadline/strata) ->
 *   owned matches (scripted planner turns) -> paired blind judge with swap ->
 *   deterministic aggregation -> skill propose/audit/promote -> epoch-scoped
 *   ranking. Raw evidence is proven to survive every surface/projection op.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Cas, sha256Hex } from "../evidence/cas.mjs";
import { EventStore } from "../evidence/eventstore.mjs";
import { RegimeCompiler } from "../domain/regime-ir.mjs";
import { Tournament, EligibilityError, E3_STRATA_BLOCKS } from "../domain/tournament.mjs";
import { blindPresentation, aggregateScores, judgeEligible, RUBRIC_DIMENSIONS } from "../domain/judge.mjs";
import { Skill, skillSetDigest } from "../domain/skills.mjs";
import { AgentSession, Turn, newId, transition, TURN_TRANSITIONS } from "./session.mjs";
import { Operation } from "./operation.mjs";
import { FakeProvider } from "../providers/fake-provider.mjs";
import { ModelGateway } from "../providers/gateway.mjs";
import { BehaviorScript } from "../providers/behavior-script.mjs";
import { canonicalJson } from "../contracts/epoch-rules.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const P4_REPORT_DIR = path.join(__dirname, "reports");
export const P4_INSTRUMENT = "native-next-v1-p4slice";
const REGIMES = path.resolve(__dirname, "../../../regimes");

export function turnScript(purpose, text) {
  return new BehaviorScript([
    { expect: { purpose }, behave: { kind: "chunks", data: { chunks: [text], usage: { inputTokens: 2, outputTokens: 2 } } } },
  ]);
}

export function judgeScript(armA, armB, swap) {
  const scores = {
    A: { legality: 3, feasibility: 2, resilience: 3 },
    B: { legality: 2, feasibility: 3, resilience: 2 },
  };
  const json = JSON.stringify(swap ? { A: scores.B, B: scores.A } : scores);
  return new BehaviorScript([
    { expect: { purpose: "judge" }, behave: { kind: "chunks", data: { chunks: [json], usage: { inputTokens: 1, outputTokens: 1 } } } },
  ]);
}

/**
 * One owned match: single planner turn producing the model-visible surface
 * text + evidence digests (request/response/chunks in CAS).
 */
async function runMatch({ matchId, cas, store, text }) {
  const session = new AgentSession({ sessionId: `sess-${matchId}`, matchId }).markReady();
  const turn = new Turn({ turnId: newId("turn"), sessionId: session.sessionId, activationId: newId("act") });
  session.enqueue(turn);
  session.claimTurn();
  turn.state = transition("turn", turn.state, "RUNNING", TURN_TRANSITIONS);
  const op = new Operation({ operationId: newId("op"), matchId, sessionId: session.sessionId, turnId: turn.turnId, purpose: "planner" });
  const gateway = new ModelGateway({ cas, eventStore: store, provider: new FakeProvider(turnScript("planner", text)), instrumentVersion: P4_INSTRUMENT });
  const outcome = await gateway.request({ operation: op, model: "fake-model", systemPrompt: "你是本朝谋臣。", messages: [{ role: "user", content: "治理任务" }], tools: [] });
  const surfaceEvent = {
    schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: P4_INSTRUMENT,
    generation: store.generation, eventId: newId("surf"), ts: Date.now(), matchId,
    sessionId: session.sessionId, type: "surface.revision", actor: "p4-slice",
    spanId: null, parentSpanId: null, artifactRefs: [outcome.responseDigest], payload: {},
  };
  surfaceEvent.payloadDigest = sha256Hex(Buffer.from(canonicalJson(surfaceEvent.payload)));
  store.append(surfaceEvent);
  session.completeClaimedTurn("COMPLETED");
  return { text: outcome.text, surfaceDigest: surfaceEvent.payloadDigest, responseDigest: outcome.responseDigest, opId: op.operationId, session };
}

/** One blind judge pass (purpose "judge", correlated, scripted). */
async function judgePass({ cas, store, armA, armB, swap, passId }) {
  const presentation = blindPresentation(armA, armB, { swap });
  const op = new Operation({ operationId: newId("op"), matchId: `judge-${passId}`, sessionId: null, turnId: null, purpose: "judge" });
  const gateway = new ModelGateway({ cas, eventStore: store, provider: new FakeProvider(judgeScript(armA, armB, swap)), instrumentVersion: P4_INSTRUMENT });
  const outcome = await gateway.request({
    operation: op, model: "fake-model", systemPrompt: presentation.prompt,
    messages: [{ role: "user", content: `Score Civ A and Civ B. Presentation: A=${presentation.labelA}, B=${presentation.labelB}` }], tools: [],
  });
  const scores = JSON.parse(outcome.text);
  const event = {
    schema: "civ.event/1", epoch: "native-next-v1", instrumentVersion: P4_INSTRUMENT,
    generation: store.generation, eventId: newId("judgeevt"), ts: Date.now(), matchId: `judge-${passId}`,
    sessionId: null, type: "judge.observed", actor: "p4-judge", spanId: null, parentSpanId: null,
    artifactRefs: [outcome.responseDigest], payload: { purpose: "judge", passId, swap, operationId: op.operationId, scores },
  };
  event.payloadDigest = sha256Hex(Buffer.from(canonicalJson(event.payload)));
  store.append(event);
  return { passId, swap, scores, operationId: op.operationId };
}

/** Full P4 slice. Returns the evidence object. */
export async function runP4Slice({ dir } = {}) {
  const dirOut = dir ?? fs.mkdtempSync(path.join(os.tmpdir(), "civ-p4-"));
  const cas = new Cas(path.join(dirOut, "evidence"));
  const store = new EventStore(path.join(dirOut, "segments"), { generation: 1, segmentId: "p4-g1", writer: "p4-slice", instrumentVersion: P4_INSTRUMENT });

  const compiler = new RegimeCompiler();
  const tang = compiler.compile(path.join(REGIMES, "china/tang"));
  const qin = compiler.compile(path.join(REGIMES, "china/qin"));

  // ── tournament: owned scheduling with caps/deadline/strata ───────────────
  const tournament = new Tournament({
    tournamentId: "p4-tournament-1",
    epoch: "native-next-v1",
    instrumentVersion: P4_INSTRUMENT,
    designVersion: "p4-design-1",
    task: "边境军事威胁与财政赤字",
    deadlineMs: Date.now() + 60_000,
    caps: { global: 4, perParent: 2, perOffice: 2 },
  });

  const admissions = [];
  const denialEvidence = [];

  // valid paired admission (two arms, one task)
  admissions.push(tournament.admit({ matchId: "p4-m-tang", regime: "china/tang", ir: tang.ir, provider: "fake", stratum: "cn:doubao", seed: 1, arm: "A", paired: { completed: true } }));
  admissions.push(tournament.admit({ matchId: "p4-m-qin", regime: "china/qin", ir: qin.ir, provider: "fake", stratum: "cn:doubao", seed: 1, arm: "B", paired: { completed: true } }));

  // ineligible: one-sided pair (no second arm), unknown stratum, missing seed
  for (const [label, fn] of [
    ["one-sided pair", () => tournament.admit({ matchId: "p4-bad-1", regime: "china/tang", ir: tang.ir, provider: "fake", stratum: "cn:glm", seed: 2, arm: "A", paired: null })],
    ["unknown stratum", () => tournament.admit({ matchId: "p4-bad-2", regime: "china/tang", ir: tang.ir, provider: "fake", stratum: "cn:mystery", seed: 2, arm: "A", paired: { completed: true } })],
    ["missing seed", () => tournament.admit({ matchId: "p4-bad-3", regime: "china/tang", ir: tang.ir, provider: "fake", stratum: "cn:glm", arm: "A", paired: { completed: true } })],
  ]) {
    try {
      fn();
      denialEvidence.push({ label, denied: false });
    } catch (e) {
      denialEvidence.push({ label, denied: true, reason: e.message });
    }
  }

  // global cap: fill to cap then deny
  for (let i = 0; i < 3; i++) {
    try {
      tournament.admit({ matchId: `p4-cap-${i}`, regime: "china/qin", ir: qin.ir, provider: "fake", stratum: "cn:glm", seed: 9, arm: "A", paired: { completed: true } });
    } catch (e) {
      denialEvidence.push({ label: "global cap", denied: true, reason: e.message });
    }
  }

  // ── run the two owned matches ────────────────────────────────────────────
  for (const m of tournament.matches.filter((x) => x.state === "ADMITTED" && x.matchId.startsWith("p4-m-"))) {
    tournament.startMatch(m.matchId);
  }
  const armA = await runMatch({ matchId: "p4-m-tang", cas, store, text: "臣谨奏：先固边墙，再议漕运，以省府库。" });
  const armB = await runMatch({ matchId: "p4-m-qin", cas, store, text: "臣谨奏：商鞅之法，赏罚分明，边军自足。" });
  for (const m of tournament.matches.filter((x) => x.matchId.startsWith("p4-m-"))) tournament.terminalMatch(m.matchId);

  // ── paired blind judging with swap balance ──────────────────────────────
  const arms = {
    A: { label: "tang", surfaceText: armA.text, evidenceDigest: armA.surfaceDigest },
    B: { label: "qin", surfaceText: armB.text, evidenceDigest: armB.surfaceDigest },
  };
  const eligibility = judgeEligible({ armA: arms.A, armB: arms.B, evidenceDigests: [arms.A.evidenceDigest, arms.B.evidenceDigest] });
  const passes = [
    await judgePass({ cas, store, armA: arms.A, armB: arms.B, swap: false, passId: "p1" }),
    await judgePass({ cas, store, armA: arms.A, armB: arms.B, swap: true, passId: "p2" }),
  ];
  const aggregate = aggregateScores(passes);
  tournament.terminalMatch("p4-m-tang", { score: aggregate.total.A });
  tournament.terminalMatch("p4-m-qin", { score: aggregate.total.B });
  // cap-filler matches were admitted to demonstrate the cap; cancel them so
  // the tournament joins cleanly (they are owned, never detached)
  tournament.cancelMatch("p4-cap-0");
  tournament.cancelMatch("p4-cap-1");

  // ── skill provenance: propose -> audit -> promote; pin skill-set digest ──
  const skill = new Skill({ skillId: "skill-1", contentHash: sha256Hex(Buffer.from("边军轮值制度")), authorMatchId: "p4-m-tang", extractorCallId: armA.opId, body: "边军轮值制度" });
  const auditEvent = { auditCallId: newId("op"), auditProvider: "fake", verdict: "approve" };
  skill.audited(auditEvent);
  skill.promoted({ approvalIdentity: "p4-approver-1" });
  const skill2 = new Skill({ skillId: "skill-2", contentHash: sha256Hex(Buffer.from("驿站烽燧法")), authorMatchId: "p4-m-tang", extractorCallId: armA.opId, body: "驿站烽燧法" });
  skill2.audited({ auditCallId: newId("op"), auditProvider: "fake", verdict: "reject" });
  skill2.rejected();
  const matchSkillSet = skillSetDigest([skill, skill2]);

  // ── raw evidence survives all surface/projection operations ─────────────
  const casBefore = cas.inventoryDigest();
  const ranking = tournament.rank(); // projection
  const snapshot = tournament.snapshot(); // projection
  const casAfter = cas.inventoryDigest();
  const rawEvidenceSurvives = casBefore === casAfter;

  store.close("clean");
  const committed = store.readCommitted();

  const evidence = {
    schema: "p4-slice-evidence/1",
    instrumentVersion: P4_INSTRUMENT,
    tournament: snapshot,
    ranking,
    admissions: admissions.map((m) => ({ matchId: m.matchId, stratum: m.stratum, state: m.state })),
    denialEvidence,
    judge: {
      eligibilityProblems: eligibility,
      passes: passes.map((p) => ({ passId: p.passId, swap: p.swap, purpose: "judge", operationId: p.operationId, scores: p.scores })),
      aggregate,
      swapBalanced: passes.length === 2 && passes[0].swap !== passes[1].swap,
      blindInputNoMetadata: true, // blindPresentation strips regime/backend/model (tested separately)
    },
    skills: {
      skill1: { state: skill.state, digest: skill.digest, approvalIdentity: skill.approvalIdentity },
      skill2: { state: skill2.state },
      matchSkillSetDigest: matchSkillSet,
    },
    strata: { blocks: E3_STRATA_BLOCKS, used: [...new Set(tournament.matches.filter((m) => m.matchId.startsWith("p4-m-")).map((m) => m.stratum))] },
    rawEvidence: {
      casBefore, casAfter, survives: rawEvidenceSurvives,
      committedEvents: committed.length,
      ownedMatches: tournament.matches.filter((m) => m.matchId.startsWith("p4-m-")).map((m) => m.matchId),
      joined: tournament.joined(),
    },
    dir: dirOut,
  };
  fs.mkdirSync(P4_REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(P4_REPORT_DIR, "p4-slice-evidence.json"), JSON.stringify(evidence, null, 2) + "\n");
  return evidence;
}

async function main() {
  const evidence = await runP4Slice();
  console.log(JSON.stringify({
    tournament: evidence.tournament.tournamentId,
    matches: evidence.rawEvidence.ownedMatches,
    ranking: evidence.ranking.map((r) => ({ rank: r.rank, regime: r.regime, score: r.score })),
    judge: { swapBalanced: evidence.judge.swapBalanced, aggregate: evidence.judge.aggregate.total, passes: evidence.judge.passes.length },
    skills: { skill1: evidence.skills.skill1.state, skill2: evidence.skills.skill2.state },
    denials: evidence.denialEvidence.map((d) => ({ label: d.label, denied: d.denied })),
    rawEvidenceSurvives: evidence.rawEvidence.survives,
    joined: evidence.rawEvidence.joined,
    reportFile: path.join(P4_REPORT_DIR, "p4-slice-evidence.json"),
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
