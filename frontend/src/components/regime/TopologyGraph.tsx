import React, { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, Network, Loader2 } from 'lucide-react';
import type { RegimeDetail, TopologyResponse, TopologyNode, TopologyEdge, EdgeKind, FunctionalRole } from '../../types/api';

interface TopologyGraphProps {
  regimes: RegimeDetail[];
  selectedRegime: RegimeDetail | null;
  onSelectRegime: (regime: RegimeDetail) => void;
}

// ── layout constants ─────────────────────────────────────────────────────────
const NODE_W = 150;
const NODE_H = 46;
const GAP_X = 32;
const LAYER_H = 122;
const MARGIN_X = 30;
const MARGIN_Y = 26;

// functional_role → node accent color (aligned with .role-* classes in index.css)
const ROLE_COLORS: Record<FunctionalRole, string> = {
  coordinator: '#ffd700',
  engineering: '#bd00ff',
  review: '#ff2e93',
  research: '#00f0ff',
  data: '#39ff14',
  devops: '#0ea5e9',
  content: '#ec4899',
  legal: '#eab308',
  management: '#f97316',
};

// edge kind → stroke style
const EDGE_STYLES: Record<EdgeKind, { color: string; width: number; dash?: string; label: string }> = {
  command: { color: '#00f0ff', width: 1.8, label: 'command 指令/汇报' },
  review: { color: '#ffd700', width: 2, dash: '6 4', label: 'review 审核/制衡' },
  veto: { color: '#ff2e93', width: 2.4, dash: '2 3', label: 'veto 否决/封驳' },
  info: { color: '#8b93a7', width: 1, dash: '1 3', label: 'info 信息共享' },
};

interface PositionedNode extends TopologyNode {
  x: number;
  y: number;
  layer: number;
}

// ── layered layout ───────────────────────────────────────────────────────────
// 1. Layer assignment runs a Kahn pass over command edges (the hierarchy
//    backbone). Because reporting edges point back upward, the command
//    subgraph can be cyclic; when Kahn stalls, the node with the largest
//    (out-degree − in-degree) surplus is placed next, one layer below its
//    already-placed predecessors.
// 2. Nodes with no command edges at all (e.g. pure liaison roles) are placed
//    one layer below their lowest placed neighbor of any edge kind, or at the
//    bottom when fully isolated.
// 3. Within each layer, two barycenter sweeps (down then up, over all edge
//    kinds) order siblings to reduce crossings.
function layoutTopology(nodes: TopologyNode[], edges: TopologyEdge[]): { nodes: PositionedNode[]; width: number; height: number } {
  const ids = nodes.map((n) => n.id);
  const layerOf = new Map<string, number>();

  const cmdPreds = new Map<string, string[]>(ids.map((id) => [id, []]));
  const cmdOut = new Map<string, number>(ids.map((id) => [id, 0]));
  const anyPreds = new Map<string, string[]>(ids.map((id) => [id, []]));
  const neighbors = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const e of edges) {
    if (e.kind === 'command') {
      cmdPreds.get(e.to)?.push(e.from);
      cmdOut.set(e.from, (cmdOut.get(e.from) || 0) + 1);
    }
    anyPreds.get(e.to)?.push(e.from);
    neighbors.get(e.from)?.push(e.to);
    neighbors.get(e.to)?.push(e.from);
  }
  const hasCommand = new Set(ids.filter((id) => (cmdPreds.get(id) || []).length > 0 || (cmdOut.get(id) || 0) > 0));

  // Phase 1: command-edge Kahn with stall breaking.
  const remaining = new Set(ids.filter((id) => hasCommand.has(id)));
  while (remaining.size > 0) {
    const ready = [...remaining].filter((id) => (cmdPreds.get(id) || []).every((p) => layerOf.has(p)));
    if (ready.length === 0) {
      // Cycle: place the most "source-like" node (largest out−in surplus).
      let best: string | null = null;
      let bestScore = -Infinity;
      for (const id of remaining) {
        const score = (cmdOut.get(id) || 0) - (cmdPreds.get(id) || []).filter((p) => !layerOf.has(p)).length;
        if (score > bestScore) { bestScore = score; best = id; }
      }
      ready.push(best!);
    }
    // Stable input order; layer = 1 + max(placed command preds), else 0.
    for (const id of ids) {
      if (!ready.includes(id)) continue;
      const predLayers = (cmdPreds.get(id) || []).filter((p) => layerOf.has(p)).map((p) => layerOf.get(p)!);
      layerOf.set(id, predLayers.length > 0 ? Math.max(...predLayers) + 1 : 0);
      remaining.delete(id);
    }
  }

  // Phase 2: nodes untouched by command edges follow any-kind neighbors.
  for (const id of ids) {
    if (layerOf.has(id)) continue;
    const predLayers = (anyPreds.get(id) || []).filter((p) => layerOf.has(p)).map((p) => layerOf.get(p)!);
    if (predLayers.length > 0) {
      layerOf.set(id, Math.max(...predLayers) + 1);
    }
  }
  const maxAssigned = Math.max(0, ...layerOf.values());
  for (const id of ids) {
    if (!layerOf.has(id)) layerOf.set(id, maxAssigned + 1); // fully isolated → bottom
  }

  // Group by layer, preserving input order initially.
  const layers = new Map<number, string[]>();
  for (const id of ids) {
    const l = layerOf.get(id)!;
    if (!layers.has(l)) layers.set(l, []);
    layers.get(l)!.push(id);
  }
  const layerNums = [...layers.keys()].sort((a, b) => a - b);

  // Barycenter sweeps to reduce crossings (down then up).
  const indexIn = (l: number) => new Map(layers.get(l)!.map((id, i) => [id, i]));
  for (let pass = 0; pass < 2; pass++) {
    const ordered = pass === 0 ? layerNums : [...layerNums].reverse();
    for (const l of ordered) {
      const idsHere = layers.get(l)!;
      const neighborLayers = new Map<string, number[]>();
      for (const id of idsHere) {
        const bs: number[] = [];
        for (const nb of neighbors.get(id) || []) {
          const nl = layerOf.get(nb)!;
          if (nl !== l && indexIn(nl).has(nb)) bs.push(indexIn(nl).get(nb)!);
        }
        if (bs.length > 0) neighborLayers.set(id, bs);
      }
      const bary = (id: string) => {
        const bs = neighborLayers.get(id);
        if (!bs || bs.length === 0) return Number.POSITIVE_INFINITY;
        return bs.reduce((s, x) => s + x, 0) / bs.length;
      };
      idsHere.sort((a, b) => bary(a) - bary(b)); // stable: keeps input order for ties
      layers.set(l, idsHere);
    }
  }

  // Coordinates; each layer centered horizontally.
  const maxInLayer = Math.max(...[...layers.values()].map((a) => a.length));
  const width = MARGIN_X * 2 + maxInLayer * NODE_W + (maxInLayer - 1) * GAP_X;
  const positioned: PositionedNode[] = [];
  for (const l of layerNums) {
    const idsHere = layers.get(l)!;
    const rowWidth = idsHere.length * NODE_W + (idsHere.length - 1) * GAP_X;
    const x0 = (width - rowWidth) / 2;
    idsHere.forEach((id, i) => {
      const n = nodes.find((nn) => nn.id === id)!;
      positioned.push({ ...n, layer: l, x: x0 + i * (NODE_W + GAP_X), y: MARGIN_Y + l * LAYER_H });
    });
  }
  const height = MARGIN_Y * 2 + (layerNums[layerNums.length - 1] ?? 0) * LAYER_H + NODE_H;
  return { nodes: positioned, width, height };
}

// ── component ────────────────────────────────────────────────────────────────

export const TopologyGraph: React.FC<TopologyGraphProps> = ({ regimes, selectedRegime, onSelectRegime }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TopologyResponse | null>(null);
  const [status, setStatus] = useState<'ok' | 'none' | 'error'>('ok');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [pinnedNode, setPinnedNode] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<TopologyEdge | null>(null);

  useEffect(() => {
    if (!selectedRegime) { setData(null); return; }
    const parts = selectedRegime.id.split('/');
    if (parts.length < 2) return;
    const [region, id] = parts;
    let cancelled = false;
    setLoading(true);
    setPinnedNode(null);
    setHoverEdge(null);
    fetch(`/api/regimes/${region}/${id}/topology`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) { setStatus('none'); setData(null); return; }
        if (!res.ok) { setStatus('error'); setData(null); return; }
        const body: TopologyResponse = await res.json();
        setData(body);
        setStatus('ok');
      })
      .catch(() => { if (!cancelled) { setStatus('error'); setData(null); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedRegime]);

  const layout = useMemo(
    () => (data ? layoutTopology(data.topology.nodes, data.topology.edges) : null),
    [data],
  );

  const posById = useMemo(
    () => new Map((layout?.nodes || []).map((n) => [n.id, n])),
    [layout],
  );

  // Sidebar lists (same grouping as OrgChart)
  const filteredRegimes = regimes.filter((r) => r.id.toLowerCase().includes(searchQuery.toLowerCase()));
  const chinaRegimes = filteredRegimes.filter((r) => r.metadata?.region === 'china');
  const globalRegimes = filteredRegimes.filter((r) => r.metadata?.region === 'global');

  const activeNodeId = pinnedNode || hoverNode;
  const activeNode = activeNodeId ? data?.topology.nodes.find((n) => n.id === activeNodeId) : null;
  const activeEdges = activeNodeId
    ? (data?.topology.edges || []).filter((e) => e.from === activeNodeId || e.to === activeNodeId)
    : [];

  const edgePath = (e: TopologyEdge): string => {
    const a = posById.get(e.from);
    const b = posById.get(e.to);
    if (!a || !b) return '';
    const x1 = a.x + NODE_W / 2;
    const y1 = a.y + NODE_H;
    const x2 = b.x + NODE_W / 2;
    const y2 = b.y;
    if (a.layer === b.layer) {
      // Same-layer: arc above the row.
      const lift = 34;
      return `M ${x1} ${a.y} C ${x1} ${a.y - lift}, ${x2} ${b.y - lift}, ${x2} ${b.y}`;
    }
    const fromY = b.layer > a.layer ? y1 : a.y; // leave from bottom (down) or top (up)
    const toY = b.layer > a.layer ? y2 : b.y + NODE_H;
    const dy = Math.abs(toY - fromY) / 2;
    const dir = b.layer > a.layer ? 1 : -1;
    return `M ${x1} ${fromY} C ${x1} ${fromY + dy * dir}, ${x2} ${toY - dy * dir}, ${x2} ${toY}`;
  };

  const arrowTip = (e: TopologyEdge): { x: number; y: number; angle: number } | null => {
    const a = posById.get(e.from);
    const b = posById.get(e.to);
    if (!a || !b) return null;
    if (a.layer === b.layer) return { x: b.x + NODE_W / 2, y: b.y, angle: 90 };
    return b.layer > a.layer
      ? { x: b.x + NODE_W / 2, y: b.y, angle: 90 }
      : { x: b.x + NODE_W / 2, y: b.y + NODE_H, angle: -90 };
  };

  const sidebarList = (list: RegimeDetail[], label: string, color: string) =>
    list.length > 0 && (
      <div className="space-y-1.5" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span className={`text-[10px] ${color} font-mono font-bold uppercase tracking-wider block`} style={{ display: 'block', fontSize: '10px' }}>
          {label} ({list.length})
        </span>
        <div className="space-y-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {list.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelectRegime(r)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold tracking-wide border transition-all ${
                selectedRegime?.id === r.id
                  ? 'bg-[rgba(0,240,255,0.06)] border-[rgba(0,240,255,0.3)] text-[var(--accent-cyan)] shadow-[0_0_8px_rgba(0,240,255,0.05)]'
                  : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.02)]'
              }`}
              style={{ fontSize: '11px', textAlign: 'left', padding: '8px 12px' }}
            >
              {r.id.split('/').pop()?.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>

      {/* Sidebar */}
      <div className="lg:col-span-1 glass-panel p-5 flex flex-col h-[540px] overflow-hidden" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', height: '540px', padding: '20px', borderRadius: '12px' }}>
        <div className="mb-4 shrink-0" style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search regimes..."
            className="w-full text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', fontSize: '12px' }}
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scroll-fade-y" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sidebarList(chinaRegimes, 'CHINA DYNASTIES', 'text-cyan-400')}
          {sidebarList(globalRegimes, 'GLOBAL EMPIRES', 'text-purple-400')}
        </div>
      </div>

      {/* Main panel */}
      <div className="lg:col-span-3 glass-panel p-6 flex flex-col h-[540px] overflow-hidden" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', height: '540px', padding: '24px', borderRadius: '12px' }}>
        {selectedRegime ? (
          <div className="flex flex-col h-full overflow-hidden" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* Header + metrics */}
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)] shrink-0" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wider" style={{ fontSize: '16px', fontWeight: 700 }}>
                  {selectedRegime.id.split('/').pop()?.replace('-', ' ')} Governance Topology
                </h3>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono block">
                  MODE: {data?.topology.mode || selectedRegime.metadata?.orchestrationPattern} · 治理结构图
                </span>
              </div>
              {data && (
                <div className="flex items-center gap-2 font-mono" style={{ display: 'flex', gap: '8px', fontSize: '9px' }}>
                  {[
                    `nodes ${data.metrics.nodes}`,
                    `edges ${data.metrics.edges}`,
                    `density ${data.metrics.density}`,
                    `depth ${data.metrics.command_depth}`,
                    `checks ${data.metrics.checks_cycles}`,
                  ].map((chip) => (
                    <span key={chip} className="px-2 py-1 rounded border border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.05)] text-cyan-300" style={{ padding: '3px 8px' }}>
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Graph viewport */}
            <div className="flex-1 overflow-auto p-2 mt-3 relative" style={{ flex: 1, overflow: 'auto', marginTop: '12px' }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-muted)]" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                  <Loader2 className="animate-spin text-[var(--accent-cyan)]" size={32} />
                  <span>Loading governance graph...</span>
                </div>
              ) : status === 'none' ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-muted)]" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
                  <ShieldAlert size={36} className="text-[rgba(255,255,255,0.1)]" />
                  <span>该政体尚未类型化 — no topology.json yet.</span>
                  <span className="text-[10px]" style={{ fontSize: '10px' }}>Currently typed: china/tang · china/qin · china/ming · china/zhou · china/shang · global/athens</span>
                </div>
              ) : status === 'error' || !data || !layout ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-muted)]" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
                  <ShieldAlert size={36} className="text-[rgba(255,46,147,0.3)]" />
                  <span>Topology failed to load or is invalid.</span>
                </div>
              ) : (
                <div className="animate-fade-in">
                  {/* Legend */}
                  <div className="flex items-center gap-4 mb-2 px-2" style={{ display: 'flex', gap: '16px', fontSize: '9px', marginBottom: '8px' }}>
                    {(Object.keys(EDGE_STYLES) as EdgeKind[]).map((k) => (
                      <span key={k} className="flex items-center gap-1.5 text-[var(--text-secondary)] font-mono" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="26" height="6">
                          <line x1="0" y1="3" x2="26" y2="3" stroke={EDGE_STYLES[k].color} strokeWidth={EDGE_STYLES[k].width} strokeDasharray={EDGE_STYLES[k].dash} />
                        </svg>
                        {EDGE_STYLES[k].label}
                      </span>
                    ))}
                  </div>

                  <svg
                    viewBox={`0 0 ${layout.width} ${layout.height}`}
                    width="100%"
                    style={{ minWidth: Math.min(layout.width, 760), display: 'block' }}
                  >
                    {/* edges */}
                    {data.topology.edges.map((e, i) => {
                      const st = EDGE_STYLES[e.kind];
                      const isActive = activeNodeId != null && (e.from === activeNodeId || e.to === activeNodeId);
                      const isHover = hoverEdge === e;
                      const tip = arrowTip(e);
                      return (
                        <g key={`${e.from}-${e.to}-${e.kind}-${i}`} opacity={activeNodeId && !isActive ? 0.25 : 1}>
                          <path
                            d={edgePath(e)}
                            fill="none"
                            stroke={st.color}
                            strokeWidth={isHover ? st.width + 1.2 : st.width}
                            strokeDasharray={st.dash}
                            opacity={isHover ? 1 : 0.75}
                          />
                          {/* fat invisible hit area for hover */}
                          <path
                            d={edgePath(e)}
                            fill="none"
                            stroke="transparent"
                            strokeWidth={12}
                            onMouseEnter={() => setHoverEdge(e)}
                            onMouseLeave={() => setHoverEdge(null)}
                          />
                          {tip && (
                            <polygon
                              points="-4,-6 4,-6 0,2"
                              fill={st.color}
                              transform={`translate(${tip.x}, ${tip.y}) rotate(${tip.angle})`}
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* nodes */}
                    {layout.nodes.map((n) => {
                      const color = ROLE_COLORS[n.functional_role] || '#8b93a7';
                      const isActive = activeNodeId === n.id;
                      return (
                        <g
                          key={n.id}
                          transform={`translate(${n.x}, ${n.y})`}
                          onMouseEnter={() => setHoverNode(n.id)}
                          onMouseLeave={() => setHoverNode(null)}
                          onClick={() => setPinnedNode(pinnedNode === n.id ? null : n.id)}
                          style={{ cursor: 'pointer' }}
                          opacity={activeNodeId && !isActive && !activeEdges.some((e) => e.from === n.id || e.to === n.id) ? 0.45 : 1}
                        >
                          <rect
                            width={NODE_W}
                            height={NODE_H}
                            rx={8}
                            fill={isActive ? 'rgba(0,240,255,0.08)' : 'rgba(18,20,32,0.85)'}
                            stroke={color}
                            strokeWidth={isActive ? 2 : 1.2}
                          />
                          <text x={10} y={19} fill="var(--text-primary)" fontSize={11} fontWeight={700}>
                            {n.label.length > 12 ? `${n.label.slice(0, 11)}…` : n.label}
                          </text>
                          <text x={10} y={34} fill={color} fontSize={8.5} fontFamily="var(--font-mono)">
                            {n.functional_role}
                          </text>
                          <text x={NODE_W - 10} y={34} fill="var(--text-muted)" fontSize={8} fontFamily="var(--font-mono)" textAnchor="end">
                            {n.id.length > 14 ? `${n.id.slice(0, 13)}…` : n.id}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>

            {/* Detail strip: hovered/pinned node or hovered edge */}
            {status === 'ok' && data && (activeNode || hoverEdge) && (
              <div className="shrink-0 mt-2 p-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(10,11,16,0.5)] text-xs" style={{ marginTop: '8px', padding: '10px 14px', fontSize: '11px' }}>
                {activeNode && (
                  <div className="flex items-start gap-3" style={{ display: 'flex', gap: '12px' }}>
                    <span className={`role-badge role-${activeNode.functional_role}`} style={{ fontSize: '9px' }}>{activeNode.functional_role}</span>
                    <div>
                      <span className="font-bold text-[var(--text-primary)]">{activeNode.label}</span>
                      <code className="ml-2 text-cyan-300" style={{ marginLeft: '8px' }}>{activeNode.id}</code>
                      <div className="text-[var(--text-muted)] mt-1" style={{ marginTop: '4px', fontSize: '10px' }}>
                        {activeEdges.length > 0
                          ? activeEdges.map((e) => `${e.from === activeNode.id ? '→' : '←'} ${e.kind} ${e.from === activeNode.id ? e.to : e.from}`).join('  ·  ')
                          : 'no edges'}
                      </div>
                    </div>
                  </div>
                )}
                {!activeNode && hoverEdge && (
                  <div>
                    <span className="font-mono" style={{ color: EDGE_STYLES[hoverEdge.kind].color }}>
                      {hoverEdge.from} —{hoverEdge.kind}→ {hoverEdge.to}
                    </span>
                    {hoverEdge.note && <div className="text-[var(--text-muted)] mt-1" style={{ marginTop: '4px', fontSize: '10px' }}>{hoverEdge.note}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-3" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
            <Network size={40} className="text-[rgba(255,255,255,0.1)]" />
            <span>Select a regime to inspect its governance topology.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopologyGraph;
