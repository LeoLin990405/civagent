// plan-diff.mjs — compare a pre-enforcement dispatch plan with topology nodes.
//
// A plan is a coordinator's ordered roster, while topology.json is a typed
// directed multigraph. Only node membership, duplicates, and the plan's own
// order are comparable. Edge direction/kind/coverage are explicitly withheld.

import { PLAN_STATES, validateDispatches } from "./dispatch-plan.mjs";

function stableBySeq(events) {
  return events.map((event, index) => ({ event, index })).sort((a, b) => {
    const as = Number.isInteger(a.event?.seq) ? a.event.seq : null;
    const bs = Number.isInteger(b.event?.seq) ? b.event.seq : null;
    if (as !== null && bs !== null && as !== bs) return as - bs;
    if (as !== null && bs === null) return -1;
    if (as === null && bs !== null) return 1;
    return a.index - b.index;
  });
}

export function extractDispatchPlan(events) {
  if (!Array.isArray(events)) {
    return { status: "not_recorded", dispatches: null, error: "event input is not an array" };
  }
  const planEvents = stableBySeq(events)
    .map(({ event }) => event)
    .filter((event) => event?.type === "turn" && event.phase === "dispatch_plan");
  if (planEvents.length === 0) {
    return { status: "not_recorded", dispatches: null, error: "no dispatch-plan event" };
  }
  if (planEvents.length !== 1) {
    return { status: PLAN_STATES.PARSE_FAILED, dispatches: null, error: "multiple dispatch-plan events" };
  }
  const event = planEvents[0];
  if (event.dispatch_plan_status === PLAN_STATES.PARSE_FAILED) {
    return {
      status: PLAN_STATES.PARSE_FAILED,
      dispatches: null,
      error: event.dispatch_plan_error || "dispatch-plan parse failed",
    };
  }
  const validated = validateDispatches({ dispatches: event.dispatch_plan });
  if (!validated.ok) {
    return { status: PLAN_STATES.PARSE_FAILED, dispatches: null, error: validated.error };
  }
  const expected = validated.dispatches.length
    ? PLAN_STATES.PARSED_NONEMPTY
    : PLAN_STATES.PARSED_EMPTY;
  if (event.dispatch_plan_status !== expected) {
    return {
      status: PLAN_STATES.PARSE_FAILED,
      dispatches: null,
      error: "dispatch-plan status does not match its structured payload",
    };
  }
  return { status: expected, dispatches: validated.dispatches, error: null };
}

export function compareDispatchPlanToTopology(planRecord, topology) {
  const supportedDimensions = [
    "planned office sequence (descriptive; not an edge path)",
    "planned office membership in declared nodes",
    "declared offices omitted from the plan",
    "undeclared and repeated planned offices",
  ];
  const unsupportedDimensions = {
    directed_edge_alignment:
      "the coordinator plan is not an office-to-office call trace",
    edge_kind_alignment:
      "plan steps do not encode command/review/info/veto",
    multiedge_coverage:
      "a repeated office name cannot identify which parallel declared edge was intended",
    edge_exercise:
      "the plan records intent before execution, not whether any declared edge fired",
  };
  const base = {
    plan_status: planRecord?.status ?? "not_recorded",
    supported_dimensions: supportedDimensions,
    unsupported_dimensions: unsupportedDimensions,
  };
  if (!planRecord ||
      planRecord.status === "not_recorded" ||
      planRecord.status === PLAN_STATES.PARSE_FAILED) {
    return {
      ...base,
      comparison_available: false,
      reason: planRecord?.error || "plan unavailable",
      planned_sequence: null,
      planned_unique_offices: null,
      declared_planned_offices: null,
      declared_not_planned_offices: null,
      undeclared_planned_offices: null,
      duplicate_planned_offices: null,
      counts: null,
    };
  }

  const declared = (Array.isArray(topology?.nodes) ? topology.nodes : [])
    .map((node) => node?.id)
    .filter((id) => typeof id === "string");
  const declaredSet = new Set(declared);
  const sequence = planRecord.dispatches.map((step) => step.office);
  const firstSeen = [];
  const frequencies = new Map();
  for (const office of sequence) {
    frequencies.set(office, (frequencies.get(office) || 0) + 1);
    if (!firstSeen.includes(office)) firstSeen.push(office);
  }
  const plannedSet = new Set(firstSeen);
  const declaredPlanned = declared.filter((office) => plannedSet.has(office));
  const declaredNotPlanned = declared.filter((office) => !plannedSet.has(office));
  const undeclared = firstSeen.filter((office) => !declaredSet.has(office));
  const duplicates = [...frequencies.entries()]
    .filter(([, count]) => count > 1)
    .map(([office, count]) => ({ office, count }));
  return {
    ...base,
    comparison_available: true,
    reason: null,
    planned_sequence: sequence,
    planned_unique_offices: firstSeen,
    declared_planned_offices: declaredPlanned,
    declared_not_planned_offices: declaredNotPlanned,
    undeclared_planned_offices: undeclared,
    duplicate_planned_offices: duplicates,
    counts: {
      plan_steps: sequence.length,
      unique_planned_offices: firstSeen.length,
      declared_planned_offices: declaredPlanned.length,
      declared_not_planned_offices: declaredNotPlanned.length,
      undeclared_planned_offices: undeclared.length,
    },
  };
}
