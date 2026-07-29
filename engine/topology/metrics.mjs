#!/usr/bin/env node
// metrics.mjs — graph metrics over a regime's topology.json.
//
// Turns "regime as graph" into numbers: size, density, command-chain depth,
// in-degree centrality, and the number of checks-and-balances cycles
// (elementary cycles that contain at least one review or veto edge).
//
// Zero dependencies. Pure functions exported for tests; CLI at the bottom.
//
//   node engine/topology/metrics.mjs <regime-dir>

import path from "node:path";
import { validateRegimeTopology } from "./validate.mjs";

// Longest simple chain (in edges) along command-kind edges. Cycles are cut by
// never revisiting a node already on the current path, so reporting edges that
// point back upward (e.g. 奏折上报) cannot inflate the depth.
export function commandDepth(topology) {
  const adj = new Map();
  for (const e of topology.edges) {
    if (e.kind !== "command") continue;
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from).push(e.to);
  }
  let best = 0;
  function dfs(node, onPath, dist) {
    best = Math.max(best, dist);
    for (const next of adj.get(node) || []) {
      if (onPath.has(next)) continue;
      onPath.add(next);
      dfs(next, onPath, dist + 1);
      onPath.delete(next);
    }
  }
  for (const n of topology.nodes) dfs(n.id, new Set([n.id]), 0);
  return best;
}

// In-degree per node across all edge kinds, sorted descending.
export function inDegreeCentrality(topology) {
  const deg = new Map(topology.nodes.map((n) => [n.id, 0]));
  for (const e of topology.edges) deg.set(e.to, (deg.get(e.to) || 0) + 1);
  return [...deg.entries()]
    .map(([id, inDegree]) => ({ id, inDegree }))
    .sort((a, b) => b.inDegree - a.inDegree || a.id.localeCompare(b.id));
}

// Count elementary cycles that include at least one review or veto edge —
// these are the regime's checks-and-balances loops. Parallel edges of
// different kinds between the same pair are merged for cycle enumeration,
// with their kinds tracked so any review/veto variant marks the cycle.
export function checksCycles(topology) {
  const kindsBetween = new Map(); // "a→b" -> Set(kind)
  const adj = new Map();
  for (const e of topology.edges) {
    const key = `${e.from}→${e.to}`;
    if (!kindsBetween.has(key)) kindsBetween.set(key, new Set());
    kindsBetween.get(key).add(e.kind);
    if (!adj.has(e.from)) adj.set(e.from, new Set());
    adj.get(e.from).add(e.to);
  }
  const ids = topology.nodes.map((n) => n.id);
  const index = new Map(ids.map((id, i) => [id, i]));
  const cycles = []; // each: array of node ids in cycle order

  // Enumerate elementary cycles; to count each cycle once, only start DFS at
  // the smallest-index node of the cycle and never visit smaller nodes.
  for (let s = 0; s < ids.length; s++) {
    const start = ids[s];
    const stack = [start];
    const onPath = new Set([start]);
    function dfs(node) {
      for (const next of adj.get(node) || []) {
        if (index.get(next) < s) continue; // belongs to an earlier cycle class
        if (next === start) {
          if (stack.length > 1) cycles.push([...stack]);
        } else if (!onPath.has(next)) {
          onPath.add(next);
          stack.push(next);
          dfs(next);
          stack.pop();
          onPath.delete(next);
        }
      }
    }
    dfs(start);
  }

  let count = 0;
  const marked = [];
  for (const cyc of cycles) {
    const hasCheck = cyc.some((from, i) => {
      const to = cyc[(i + 1) % cyc.length];
      const kinds = kindsBetween.get(`${from}→${to}`);
      return kinds && (kinds.has("review") || kinds.has("veto"));
    });
    if (hasCheck) {
      count++;
      marked.push(cyc);
    }
  }
  return { count, cycles: marked };
}

// All metrics for one validated topology object.
export function computeMetrics(topology) {
  const n = topology.nodes.length;
  const m = topology.edges.length;
  const inDegree = inDegreeCentrality(topology);
  const checks = checksCycles(topology);
  return {
    regime: topology.regime,
    mode: topology.mode,
    nodes: n,
    edges: m,
    density: n > 1 ? Math.round((m / (n * (n - 1))) * 1000) / 1000 : 0,
    command_depth: commandDepth(topology),
    top_in_degree: inDegree.filter((d) => d.inDegree === inDegree[0]?.inDegree),
    in_degree: inDegree,
    checks_cycles: checks.count,
    checks_cycle_nodes: checks.cycles,
  };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith("metrics.mjs")) {
  const regimeDir = process.argv[2];
  if (!regimeDir) {
    console.error("Usage: node engine/topology/metrics.mjs <regime-dir>");
    process.exit(1);
  }
  const v = validateRegimeTopology(path.resolve(regimeDir));
  if (!v.ok) {
    for (const e of v.errors) console.error(`✗ ${e}`);
    process.exit(1);
  }
  console.log(JSON.stringify(computeMetrics(v.topology), null, 2));
}
