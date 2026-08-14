/**
 * state-machines.test.mjs — L0 tests for session/turn/activation/operation
 * state machines (plan §9).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { AgentSession, Turn, Activation, transition, TURN_TRANSITIONS, newId } from "../session.mjs";
import { Operation } from "../operation.mjs";

test("session FIFO inbox claims in order, at most one claimed turn", () => {
  const s = new AgentSession({ sessionId: "s1", matchId: "m1" }).markReady();
  const t1 = new Turn({ turnId: "t1", sessionId: "s1", activationId: "a1" });
  const t2 = new Turn({ turnId: "t2", sessionId: "s1", activationId: "a1" });
  s.enqueue(t1);
  s.enqueue(t2);
  assert.equal(s.claimTurn(), t1, "FIFO head must be claimed first");
  assert.throws(() => s.claimTurn(), /already has a claimed\/running turn/);
  s.completeClaimedTurn("COMPLETED");
  assert.equal(s.claimTurn(), t2);
  s.completeClaimedTurn("COMPLETED");
  assert.throws(() => s.claimTurn(), /inbox empty/);
});

test("illegal session transitions throw", () => {
  const s = new AgentSession({ sessionId: "s1", matchId: "m1" });
  assert.throws(() => s.quiesce(), /illegal session transition CREATED -> QUIESCING/);
  s.markReady();
  s.close();
  assert.throws(() => s.enqueue({}), /enqueue on closed session/);
});

test("turn transitions are guarded", () => {
  assert.throws(() => transition("turn", "QUEUED", "RUNNING", TURN_TRANSITIONS), /illegal turn transition/);
  assert.equal(transition("turn", "QUEUED", "CLAIMED", TURN_TRANSITIONS), "CLAIMED");
});

test("activation lifecycle", () => {
  const a = new Activation({ activationId: "a1", sessionId: "s" });
  a.start();
  assert.equal(a.state, "ACTIVE");
  a.stop("normal");
  assert.equal(a.state, "STOPPED");
  assert.equal(a.stopReason, "normal");
  assert.throws(() => a.start(), /illegal activation transition STOPPED -> STARTING/);
});

test("operation full lifecycle: ACCEPTED -> START_INTENT_DURABLE -> RECEIPT_DURABLE -> OP_SETTLED -> OP_FLUSHED", () => {
  const op = new Operation({ operationId: "op1", matchId: "m", sessionId: "s", turnId: "t", purpose: "planner" });
  op.startIntentDurable();
  op.receiptDurable();
  op.settle();
  op.flush();
  assert.equal(op.state, "OP_FLUSHED");
  assert.throws(() => op.settle(), /illegal operation transition OP_FLUSHED -> OP_SETTLED/);
});

test("missing receipt after start intent defaults to START_OUTCOME_UNKNOWN, never NOT_STARTED", () => {
  const op = new Operation({ operationId: "op2", matchId: "m", sessionId: "s", turnId: "t", purpose: "planner" });
  op.startIntentDurable();
  op.startOutcomeUnknown("crash before receipt");
  assert.equal(op.state, "START_OUTCOME_UNKNOWN");
});

test("receipt without terminal defaults to EFFECT_OUTCOME_UNKNOWN", () => {
  const op = new Operation({ operationId: "op3", matchId: "m", sessionId: "s", turnId: "t", purpose: "planner" });
  op.startIntentDurable();
  op.receiptDurable();
  op.effectOutcomeUnknown("crash after receipt");
  assert.equal(op.state, "EFFECT_OUTCOME_UNKNOWN");
});

test("uncertain operations are never auto-retried; explicit retry gets a new id", () => {
  const op = new Operation({ operationId: "op4", matchId: "m", sessionId: "s", turnId: "t", purpose: "planner", idempotencyKey: "k1" });
  op.startIntentDurable();
  op.startOutcomeUnknown("crash");
  // settled operations cannot retry
  const op5 = new Operation({ operationId: "op5", matchId: "m", sessionId: "s", turnId: "t", purpose: "planner" });
  op5.startIntentDurable();
  op5.receiptDurable();
  op5.settle();
  assert.throws(() => op5.retry({}), /retry only from uncertain\/failed states/);
  const retry = op.retry({ operationId: "op4-r1", matchId: "m", sessionId: "s", turnId: "t", purpose: "planner" });
  assert.notEqual(retry.operationId, op.operationId);
  assert.equal(retry.retryOfOperationId, "op4");
  assert.equal(retry.idempotencyKey, "k1");
});

test("newId produces distinct prefixed ids", () => {
  assert.match(newId("op"), /^op-[0-9a-f-]{36}$/);
  assert.notEqual(newId("op"), newId("op"));
});
