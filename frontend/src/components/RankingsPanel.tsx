import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RefreshCw, AlertTriangle, Loader2, BarChart3 } from 'lucide-react';
import type { StatsRankingsResponse, RankingRow, PairwiseRow } from '../types/api';

// Cross-tournament rankings panel: Bradley-Terry abilities with bootstrap 95%
// CIs as a log-scale forest plot, a standings table, and a pairwise
// significance matrix. Data: GET /api/stats/rankings (engine/v5/stats.mjs).

// ── forest plot geometry ─────────────────────────────────────────────────────
const ROW_H = 30;
const PAD_L = 170;
const PAD_R = 30;
const PAD_T = 26;
const PAD_B = 34;
const PLOT_W = 560;

function logTicks(lo: number, hi: number): number[] {
  const ticks: number[] = [];
  // candidate grid on a log10 ladder
  for (let e = Math.floor(Math.log10(Math.max(lo, 1e-3))) - 1; e <= Math.ceil(Math.log10(hi)); e++) {
    for (const m of [1, 2.5, 5]) {
      const v = m * Math.pow(10, e);
      if (v >= lo && v <= hi) ticks.push(v);
    }
  }
  return ticks;
}

const fmtAbility = (v: number) => (v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v.toFixed(3));

// CI entirely above 1 → significantly above the average opponent (gold);
// entirely below 1 → below (crimson); straddling 1 → neutral (gray).
function rowTone(r: RankingRow): { color: string; label: string } {
  if (r.ci95[0] > 1) return { color: 'var(--accent-gold)', label: '>avg' };
  if (r.ci95[1] < 1) return { color: 'var(--accent-crimson)', label: '<avg' };
  return { color: '#8b93a7', label: 'ns' };
}

export const RankingsPanel: React.FC = () => {
  const [data, setData] = useState<StatsRankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stats/rankings');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const hasData = !!data && data.rankings.length > 0;
  const smallSample = !!data && data.tournamentsUsed > 0 && data.tournamentsUsed < (data.minSample || 5);

  // Forest-plot x mapping on a log scale.
  const plot = useMemo(() => {
    if (!hasData) return null;
    const lo = Math.min(...data.rankings.map((r) => r.ci95[0]), 1) * 0.8;
    const hi = Math.max(...data.rankings.map((r) => r.ci95[1]), 1) * 1.25;
    const logLo = Math.log(lo);
    const logHi = Math.log(hi);
    const x = (v: number) => PAD_L + ((Math.log(Math.max(v, 1e-9)) - logLo) / (logHi - logLo)) * PLOT_W;
    const ticks = logTicks(lo, hi);
    return { x, ticks, lo, hi, width: PAD_L + PLOT_W + PAD_R, height: PAD_T + data.rankings.length * ROW_H + PAD_B };
  }, [data, hasData]);

  const pairMatrix = useMemo(() => {
    if (!hasData) return null;
    const m = new Map<string, PairwiseRow>();
    for (const p of data.pairwise) m.set(`${p.a}|${p.b}`, p);
    return m;
  }, [data, hasData]);

  return (
    <div className="glass-panel p-6 space-y-6 animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div className="flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="flex items-center justify-center w-9 h-9 rounded bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.3)] text-[var(--accent-gold)]" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontSize: '18px', fontWeight: 700 }}>Cross-Tournament Rankings</h2>
            <p className="text-xs text-[var(--text-secondary)]" style={{ fontSize: '12px' }}>
              Bradley-Terry abilities · bootstrap 95% CI (B={data?.B ?? '…'}) · tournaments: {data?.tournamentsUsed ?? '…'}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="p-2 rounded border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[var(--text-secondary)] hover:text-white transition-all"
          title="Recompute rankings"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Warning banners */}
      {data && data.warnings.length > 0 && (
        <div className="space-y-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[rgba(255,215,0,0.25)] bg-[rgba(255,215,0,0.05)] text-amber-300 text-xs" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '12px' }}>
              <AlertTriangle size={13} /> {w}
            </div>
          ))}
        </div>
      )}
      {smallSample && !data?.warnings.some((w) => w.includes('样本不足')) && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[rgba(255,215,0,0.25)] bg-[rgba(255,215,0,0.05)] text-amber-300 text-xs" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '12px' }}>
          <AlertTriangle size={13} /> 样本不足（{data!.tournamentsUsed} &lt; {data!.minSample} 场锦标赛），CI 仅供参考
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text-muted)]" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '64px 0' }}>
          <Loader2 className="animate-spin text-[var(--accent-cyan)]" size={30} />
          <span className="text-xs">Fitting Bradley-Terry model + bootstrap…</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-[var(--text-muted)]" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '64px 0' }}>
          <AlertTriangle size={30} className="text-[var(--accent-crimson)]" />
          <span className="text-xs">Failed to load rankings: {error}</span>
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-[var(--text-muted)]" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '64px 0' }}>
          <BarChart3 size={30} className="text-[rgba(255,255,255,0.1)]" />
          <span className="text-xs">No ranked tournaments yet. Run <code className="text-[var(--accent-gold)]">civagent tournament --civs …</code> a few times first.</span>
        </div>
      ) : (
        <>
          {/* Forest plot */}
          {plot && (
            <div style={{ overflowX: 'auto' }}>
              <svg viewBox={`0 0 ${plot.width} ${plot.height}`} width="100%" style={{ minWidth: Math.min(plot.width, 720), display: 'block' }}>
                {/* grid + ticks */}
                {plot.ticks.map((t) => (
                  <g key={t}>
                    <line x1={plot.x(t)} y1={PAD_T - 6} x2={plot.x(t)} y2={plot.height - PAD_B} stroke="rgba(255,255,255,0.05)" />
                    <text x={plot.x(t)} y={plot.height - PAD_B + 16} textAnchor="middle" fontSize={9} fill="var(--text-muted)" fontFamily="var(--font-mono)">
                      {fmtAbility(t)}
                    </text>
                  </g>
                ))}
                {/* average-opponent reference at gamma = 1 */}
                <line x1={plot.x(1)} y1={PAD_T - 6} x2={plot.x(1)} y2={plot.height - PAD_B} stroke="rgba(0,240,255,0.35)" strokeDasharray="4 3" />
                <text x={plot.x(1)} y={PAD_T - 10} textAnchor="middle" fontSize={8.5} fill="var(--accent-cyan)" fontFamily="var(--font-mono)">γ=1</text>

                {data!.rankings.map((r, i) => {
                  const y = PAD_T + i * ROW_H + ROW_H / 2;
                  const tone = rowTone(r);
                  return (
                    <g key={r.regime}>
                      <text x={PAD_L - 10} y={y + 3.5} textAnchor="end" fontSize={10.5} fill="var(--text-primary)" fontWeight={600} fontFamily="var(--font-mono)">
                        #{r.rank} {r.regime}
                      </text>
                      <line x1={plot.x(r.ci95[0])} y1={y} x2={plot.x(r.ci95[1])} y2={y} stroke={tone.color} strokeWidth={2} opacity={0.75} />
                      <line x1={plot.x(r.ci95[0])} y1={y - 4} x2={plot.x(r.ci95[0])} y2={y + 4} stroke={tone.color} strokeWidth={1.6} />
                      <line x1={plot.x(r.ci95[1])} y1={y - 4} x2={plot.x(r.ci95[1])} y2={y + 4} stroke={tone.color} strokeWidth={1.6} />
                      <circle cx={plot.x(r.ability)} cy={y} r={4.5} fill={tone.color} stroke="#0c0d16" strokeWidth={1.5} />
                      <text x={plot.x(r.ci95[1]) + 8} y={y + 3} fontSize={8.5} fill={tone.color} fontFamily="var(--font-mono)">
                        {fmtAbility(r.ability)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Standings table */}
          <div className="glass-panel p-4 bg-[rgba(10,11,16,0.3)] border-[rgba(255,255,255,0.04)] rounded-lg" style={{ padding: '16px', borderRadius: '8px' }}>
            <table className="w-full text-left font-mono text-[11px]" style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr className="text-[var(--text-muted)]" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['rank', 'regime', 'ability γ', 'CI 95%', 'med rank', 'rank CI', 'games'].map((h) => (
                    <th key={h} className="pb-2 pr-4" style={{ paddingBottom: '8px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[var(--text-secondary)]">
                {data!.rankings.map((r) => {
                  const tone = rowTone(r);
                  return (
                    <tr key={r.regime} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="py-2 pr-4" style={{ color: tone.color }}>#{r.rank}</td>
                      <td className="py-2 pr-4 text-[var(--text-primary)]">{r.regime}</td>
                      <td className="py-2 pr-4">{fmtAbility(r.ability)}</td>
                      <td className="py-2 pr-4">[{fmtAbility(r.ci95[0])}, {fmtAbility(r.ci95[1])}]</td>
                      <td className="py-2 pr-4">{r.medianRank}</td>
                      <td className="py-2 pr-4">[{r.rankCi95[0]}, {r.rankCi95[1]}]</td>
                      <td className="py-2">{r.games}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pairwise significance matrix */}
          {pairMatrix && data!.regimes.length > 1 && (
            <div className="glass-panel p-4 bg-[rgba(10,11,16,0.3)] border-[rgba(255,255,255,0.04)] rounded-lg" style={{ padding: '16px', borderRadius: '8px' }}>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3" style={{ fontSize: '10px', marginBottom: '12px' }}>
                PAIRWISE SIGNIFICANCE (log-γ diff CI95 excludes 0)
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table className="font-mono text-[10px]" style={{ borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '4px 8px' }}></th>
                      {data!.regimes.map((c) => (
                        <th key={c} className="text-[var(--text-muted)]" style={{ padding: '4px 8px', fontWeight: 600 }}>
                          {c.split('/').pop()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data!.regimes.map((a) => (
                      <tr key={a}>
                        <td className="text-[var(--text-muted)]" style={{ padding: '4px 8px', fontWeight: 600 }}>
                          {a.split('/').pop()}
                        </td>
                        {data!.regimes.map((b) => {
                          if (a === b) {
                            return <td key={b} style={{ padding: '4px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.15)' }}>—</td>;
                          }
                          const key = [a, b].sort().join('|');
                          const p = pairMatrix.get(key);
                          if (!p) {
                            return <td key={b} style={{ padding: '4px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.15)' }}>·</td>;
                          }
                          // Cell from row a's perspective.
                          const forward = p.a === a;
                          const wins = forward ? p.winsA : p.winsB;
                          const losses = forward ? p.winsB : p.winsA;
                          const title = `${a} vs ${b}: ${wins}-${losses} (${p.games} games) Δlogγ CI95 [${forward ? p.ci95[0] : -p.ci95[1]}, ${forward ? p.ci95[1] : -p.ci95[0]}] ${p.significant ? 'SIGNIFICANT' : 'ns'}`;
                          return (
                            <td
                              key={b}
                              title={title}
                              style={{
                                padding: '4px 8px',
                                textAlign: 'center',
                                cursor: 'default',
                                color: p.significant ? 'var(--accent-gold)' : 'rgba(255,255,255,0.25)',
                                background: p.significant ? 'rgba(255,215,0,0.06)' : 'transparent',
                                border: '1px solid rgba(255,255,255,0.04)',
                                fontWeight: p.significant ? 700 : 400,
                              }}
                            >
                              {p.significant ? '✓' : '·'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RankingsPanel;
