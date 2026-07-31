// dispatch-plan.mjs — pre-enforcement dispatch planning and roster enforcement.
//
// The plan is observational data for R11-B. It is elicited before any
// enforcement text is shown, with tools disabled, then the execution call
// resumes the same coordinator session. Enforcement is deliberately narrower
// than topology execution: it can require coordinator→office dispatches, but it
// cannot make Claude Code subagents call one another or prove typed edges fired.

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

export const PLAN_MARKER_OPEN = "[CIVAGENT_DISPATCH_PLAN]";
export const PLAN_MARKER_CLOSE = "[/CIVAGENT_DISPATCH_PLAN]";
export const PLAN_STATES = Object.freeze({
  PARSED_NONEMPTY: "parsed_nonempty",
  PARSED_EMPTY: "parsed_empty",
  PARSE_FAILED: "parse_failed",
});

const OFFICE_ID_RE = /^[A-Za-z0-9_.-]+$/;
const DISPATCH_TOKEN_RE = /\[→ ([A-Za-z0-9_.-]+)\]/g;

export function listAgentOffices(agentsJson) {
  try {
    const parsed = typeof agentsJson === "string" ? JSON.parse(agentsJson) : agentsJson;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    return Object.keys(parsed).filter((id) => OFFICE_ID_RE.test(id));
  } catch {
    return [];
  }
}

export function buildPlanPrompt({ task, offices }) {
  const officeLines = offices.length
    ? offices.map((office) => `- ${office}`).join("\n")
    : "(none)";
  return `You are about to handle the task below. Before doing any task work,
truthfully record which available offices, if any, you would choose to call.

Task:
${task}

Available offices:
${officeLines}

This is a measurement of your unforced intent. Choosing zero offices is valid.
Choosing fewer offices is valid. Do not add offices merely to fill the plan.
Do not execute the task and do not call an office yet.

Return exactly one JSON object between the marker lines:
${PLAN_MARKER_OPEN}
{"dispatches":[{"office":"office-id","order":1,"responsibility":"specific responsibility"}]}
${PLAN_MARKER_CLOSE}

Use {"dispatches":[]} when you would call no office. Every office must be from
the available list; order values must be unique consecutive integers starting
at 1. Output no other marker block.`;
}

function markerCount(text, marker) {
  let count = 0;
  let from = 0;
  while (true) {
    const at = text.indexOf(marker, from);
    if (at < 0) return count;
    count += 1;
    from = at + marker.length;
  }
}

export function validateDispatches(value, allowedOffices = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "plan must be a JSON object" };
  }
  if (!Array.isArray(value.dispatches)) {
    return { ok: false, error: "plan.dispatches must be an array" };
  }

  const allowed = Array.isArray(allowedOffices) ? new Set(allowedOffices) : null;
  const dispatches = [];
  const orders = new Set();
  for (let i = 0; i < value.dispatches.length; i += 1) {
    const step = value.dispatches[i];
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      return { ok: false, error: `dispatches[${i}] must be an object` };
    }
    const office = step.office;
    const order = step.order;
    const responsibility = step.responsibility;
    if (typeof office !== "string" || !OFFICE_ID_RE.test(office)) {
      return { ok: false, error: `dispatches[${i}].office is not a bare office id` };
    }
    if (allowed && !allowed.has(office)) {
      return { ok: false, error: `dispatches[${i}].office is not available: ${office}` };
    }
    if (!Number.isInteger(order) || order < 1 || orders.has(order)) {
      return { ok: false, error: `dispatches[${i}].order must be a unique positive integer` };
    }
    if (typeof responsibility !== "string" || responsibility.trim().length === 0) {
      return { ok: false, error: `dispatches[${i}].responsibility must be non-empty` };
    }
    orders.add(order);
    dispatches.push({ office, order, responsibility: responsibility.trim() });
  }
  dispatches.sort((a, b) => a.order - b.order);
  for (let i = 0; i < dispatches.length; i += 1) {
    if (dispatches[i].order !== i + 1) {
      return { ok: false, error: "order values must be consecutive starting at 1" };
    }
  }
  return { ok: true, dispatches };
}

export function parsePlanOutput(output, allowedOffices = null) {
  const raw = typeof output === "string" ? output : "";
  if (markerCount(raw, PLAN_MARKER_OPEN) !== 1 ||
      markerCount(raw, PLAN_MARKER_CLOSE) !== 1) {
    return {
      status: PLAN_STATES.PARSE_FAILED,
      dispatches: null,
      error: "expected exactly one dispatch-plan marker block",
    };
  }
  const open = raw.indexOf(PLAN_MARKER_OPEN);
  const close = raw.indexOf(PLAN_MARKER_CLOSE);
  if (close <= open) {
    return {
      status: PLAN_STATES.PARSE_FAILED,
      dispatches: null,
      error: "dispatch-plan markers are out of order",
    };
  }
  let decoded;
  try {
    decoded = JSON.parse(raw.slice(open + PLAN_MARKER_OPEN.length, close).trim());
  } catch (error) {
    return {
      status: PLAN_STATES.PARSE_FAILED,
      dispatches: null,
      error: `dispatch-plan JSON parse failed: ${error.message}`,
    };
  }
  const validated = validateDispatches(decoded, allowedOffices);
  if (!validated.ok) {
    return {
      status: PLAN_STATES.PARSE_FAILED,
      dispatches: null,
      error: validated.error,
    };
  }
  return {
    status: validated.dispatches.length
      ? PLAN_STATES.PARSED_NONEMPTY
      : PLAN_STATES.PARSED_EMPTY,
    dispatches: validated.dispatches,
    error: null,
  };
}

export function buildPlanArgs({ agentsJson, prompt, sessionId }) {
  return [
    "--agents", agentsJson,
    "--tools", "",
    "--output-format", "text",
    "--session-id", sessionId,
    "-p", prompt,
  ];
}

export function runPlanCall({
  command,
  args,
  env,
  timeoutMs = 120_000,
  spawnImpl = spawn,
}) {
  return new Promise((resolve) => {
    let settled = false;
    let stdout = "";
    let stderr = "";
    let child;
    let timer = null;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve({ stdout, stderr, ...result });
    };
    try {
      child = spawnImpl(command, args, { env, stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      resolve({ stdout, stderr, code: null, signal: null, error: error.message });
      return;
    }
    child.stdout?.on("data", (chunk) => { stdout += chunk; });
    child.stderr?.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => finish({ code: null, signal: null, error: error.message }));
    child.on("close", (code, signal) => finish({
      code,
      signal,
      error: code === 0 ? null : `plan backend exited ${code}${signal ? ` (${signal})` : ""}`,
    }));
    timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish({ code: null, signal: "SIGKILL", error: `plan backend timed out after ${timeoutMs}ms` });
    }, timeoutMs);
  });
}

export function officesWithIncomingEdges(topology) {
  const nodeIds = new Set(
    (Array.isArray(topology?.nodes) ? topology.nodes : [])
      .map((node) => node?.id)
      .filter((id) => typeof id === "string" && OFFICE_ID_RE.test(id)),
  );
  const required = [];
  const seen = new Set();
  for (const edge of Array.isArray(topology?.edges) ? topology.edges : []) {
    const office = edge?.to;
    if (!nodeIds.has(office) || seen.has(office)) continue;
    seen.add(office);
    required.push(office);
  }
  return required.sort();
}

export function loadRequiredOffices(regimeDir) {
  const topologyPath = path.join(regimeDir, "topology.json");
  try {
    const topology = JSON.parse(fs.readFileSync(topologyPath, "utf8"));
    return { ok: true, requiredOffices: officesWithIncomingEdges(topology), error: null };
  } catch (error) {
    return { ok: false, requiredOffices: [], error: `cannot load topology: ${error.message}` };
  }
}

export function buildEnforcementInstruction(requiredOffices) {
  if (!requiredOffices.length) {
    return "\n\nEXPERIMENTAL DISPATCH REQUIREMENT:\nNo office has an incoming declared edge; no office dispatch is required.";
  }
  return `\n\nEXPERIMENTAL DISPATCH REQUIREMENT:
After the unforced plan above was recorded, this arm entered the enforced
condition. During execution you MUST use the subagent dispatch tool to call
each office below at least once:
${requiredOffices.map((office) => `- ${office}`).join("\n")}

This requirement applies to this arm's own declared topology. Complete the task
after those dispatches. Do not merely say that an office was called.`;
}

export function dispatchOfficesFromText(text) {
  if (typeof text !== "string") return [];
  const offices = [];
  DISPATCH_TOKEN_RE.lastIndex = 0;
  let match;
  while ((match = DISPATCH_TOKEN_RE.exec(text)) !== null) offices.push(match[1]);
  return offices;
}

export function evaluateEnforcement({
  requested,
  topologyLoaded = true,
  topologyError = null,
  requiredOffices = [],
  dispatchedOffices = [],
}) {
  const dispatched = [...new Set(dispatchedOffices)].sort();
  if (!requested) {
    return {
      status: "not_requested",
      requiredOffices: [],
      dispatchedOffices: dispatched,
      missingOffices: [],
      attempts: 0,
      basis: "declared_topology_nodes_with_incoming_edges",
    };
  }
  if (!topologyLoaded) {
    return {
      status: "enforcement_failed",
      requiredOffices: [],
      dispatchedOffices: dispatched,
      missingOffices: [],
      attempts: 1,
      error: topologyError || "topology unavailable",
      basis: "declared_topology_nodes_with_incoming_edges",
    };
  }
  const required = [...new Set(requiredOffices)].sort();
  const present = new Set(dispatched);
  const missing = required.filter((office) => !present.has(office));
  return {
    status: missing.length ? "enforcement_failed" : "enforcement_passed",
    requiredOffices: required,
    dispatchedOffices: dispatched,
    missingOffices: missing,
    attempts: 1,
    basis: "declared_topology_nodes_with_incoming_edges",
  };
}
