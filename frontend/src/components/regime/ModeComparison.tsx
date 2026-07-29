import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import type { RegimeDetail } from '../../types/api';

interface ModeComparisonProps {
  regimes: RegimeDetail[];
}

interface PatternInfo {
  id: string;
  enName: string;
  description: string;
  color: string;
  borderColor: string;
}

const PATTERNS_CATALOG: PatternInfo[] = [
  {
    id: 'centralized',
    enName: 'Centralized Star Topology',
    description: 'A single central coordinator issues commands directly to all execution nodes — maximal decision and execution speed, but no fault tolerance or distributed checks.',
    color: 'rgba(255, 46, 147, 0.08)',
    borderColor: 'rgba(255, 46, 147, 0.35)',
  },
  {
    id: 'checks-and-balances',
    enName: 'Checks & Balances Pipeline',
    description: 'A pipelined draft → review → execute cascade with veto feedback loops; highly fault-tolerant and self-correcting, suited to high-stakes decisions.',
    color: 'rgba(255, 215, 0, 0.08)',
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  {
    id: 'democratic',
    enName: 'Democratic Voting Consensus',
    description: 'Parallel multi-agent deliberation that aggregates consensus via voting/tallying algorithms; prioritizes procedural legitimacy and preference diversity.',
    color: 'rgba(0, 240, 255, 0.08)',
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  {
    id: 'dual-track',
    enName: 'Dual-Track Redundancy',
    description: 'Two or more mutually independent execution/decision chains run in parallel, providing information redundancy, independent oversight, and hot-standby backup.',
    color: 'rgba(189, 0, 255, 0.08)',
    borderColor: 'rgba(189, 0, 255, 0.35)',
  },
  {
    id: 'federation',
    enName: 'Federation Decentralization',
    description: 'A central coordinating hub coexists with heterogeneous autonomous sub-nodes; highly elastic, suited to locally specialized, highly varied distributed scenarios.',
    color: 'rgba(57, 255, 20, 0.08)',
    borderColor: 'rgba(57, 255, 20, 0.35)',
  },
  {
    id: 'theocratic',
    enName: 'Theocratic Alignment Hierarchy',
    description: 'Hierarchical governance under a supreme constitution/principle with a single theological or final-interpretation authority, ensuring absolute value alignment in the execution layer.',
    color: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
];

export const ModeComparison: React.FC<ModeComparisonProps> = ({ regimes }) => {
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  // Group regimes by pattern
  const getRegimesByPattern = (patternId: string) => {
    return regimes.filter(r => r.metadata?.orchestrationPattern === patternId);
  };

  // Get max count for chart scaling
  const maxCount = Math.max(...PATTERNS_CATALOG.map(p => getRegimesByPattern(p.id).length), 1);

  const toggleExpand = (patternId: string) => {
    if (expandedPattern === patternId) {
      setExpandedPattern(null);
    } else {
      setExpandedPattern(patternId);
    }
  };

  return (
    <div className="space-y-8 overflow-y-auto max-h-[600px] pr-2 scroll-fade-y animate-fade-in">
      
      {/* Top Section: Quick bar chart */}
      <div className="glass-panel p-6 bg-[var(--bg-glass-heavy)] border-[var(--border-subtle)] rounded-xl shadow-[inset_var(--shadow-glass)]">
        <div className="flex items-center gap-3 mb-6 text-[var(--accent-cyan)] font-heading">
          <BarChart3 size={18} className="drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" />
          <h4 className="text-sm font-black uppercase tracking-widest drop-shadow-[0_0_3px_rgba(0,240,255,0.3)]">
            CANONICAL ORCHESTRATION DISTRIBUTION
          </h4>
        </div>

        {/* Dynamic bar charts */}
        <div className="space-y-4">
          {PATTERNS_CATALOG.map((p) => {
            const list = getRegimesByPattern(p.id);
            const percent = ((list.length / maxCount) * 100).toFixed(0);
            
            return (
              <div key={p.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
                  <span className="uppercase tracking-wider">{p.enName} ({p.id})</span>
                  <span className="font-mono text-[var(--text-primary)]">{list.length} Regimes ({percent}%)</span>
                </div>
                {/* Visual Bar container */}
                <div className="w-full bg-[var(--bg-glass-light)] border border-[var(--border-subtle)] h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
                    style={{
                      width: `${percent}%`,
                      background: `linear-gradient(to right, ${p.borderColor.replace('0.35', '0.2')}, ${p.borderColor.replace('0.35', '0.8')})`,
                      boxShadow: `0 0 10px ${p.borderColor.replace('0.35', '0.4')}`
                    }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.3)] to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mode Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PATTERNS_CATALOG.map((p) => {
          const list = getRegimesByPattern(p.id);
          const isExpanded = expandedPattern === p.id;

          return (
            <div
              key={p.id}
              className="glass-panel p-6 flex flex-col justify-between transition-transform hover:-translate-y-1"
              style={{
                backgroundColor: p.color,
                borderColor: p.borderColor,
                boxShadow: `inset 0 0 20px ${p.borderColor.replace('0.35', '0.05')}, 0 4px 20px ${p.borderColor.replace('0.35', '0.1')}`
              }}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-[var(--text-primary)] tracking-wide">
                      {p.enName}
                    </h3>
                    <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest block mt-1">
                      {p.id}
                    </span>
                  </div>
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-[var(--shadow-glass)] bg-[var(--bg-surface)]"
                    style={{
                      border: `2px solid ${p.borderColor}`,
                      color: p.borderColor.replace('0.35', '1')
                    }}
                  >
                    {list.length}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {p.description}
                </p>
              </div>

              {/* Collapsible Regimes trigger */}
              <div className="border-t border-[var(--border-subtle)] pt-4 mt-6">
                <button
                  onClick={() => toggleExpand(p.id)}
                  className="flex items-center gap-2 text-xs font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-widest w-full transition-colors"
                >
                  {isExpanded ? (
                    <>
                      Hide Regimes <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      Show Mapped Regimes ({list.length}) <ChevronDown size={16} />
                    </>
                  )}
                </button>

                {/* Expanded list of chips */}
                {isExpanded && (
                  <div className="flex flex-wrap gap-2 mt-4 animate-fade-in">
                    {list.map((r) => {
                      const name = r.id.split('/').pop()?.replace('-', ' ') || '';
                      const isChina = r.metadata?.region === 'china';

                      return (
                        <span
                          key={r.id}
                          className={`text-[10px] px-3 py-1 rounded-md font-mono font-bold border ${isChina ? 'border-[var(--border-glow-cyan)] text-[var(--accent-cyan)] bg-[var(--bg-glass-light)]' : 'border-[var(--border-glow-purple)] text-[var(--accent-purple)] bg-[var(--bg-glass-light)]'}`}
                        >
                          {name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
export default ModeComparison;
