import React from 'react';
import { ShieldCheck, Crosshair, Network, GitPullRequest, Search, FileSignature, XCircle } from 'lucide-react';

interface TopologyProps {
  regime: string;
}

export const RegimeTopology: React.FC<TopologyProps> = ({ regime }) => {

  const renderTangTopology = () => (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8 relative p-8">
      {/* Background connecting lines using SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-cyan)" />
          </marker>
          <marker id="vetohead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-crimson)" />
          </marker>
        </defs>
        <path d="M 50% 20% L 50% 40%" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrowhead)" />
        <path d="M 50% 45% L 50% 65%" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrowhead)" />
        
        {/* Veto line */}
        <path d="M 40% 42% Q 30% 32% 40% 22%" stroke="var(--accent-crimson)" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#vetohead)" fill="transparent" />
        <text x="32%" y="32%" fill="var(--accent-crimson)" fontSize="12" dominantBaseline="middle" textAnchor="middle">驳回 (Veto)</text>
        
        {/* Branching to 6 ministries */}
        <path d="M 50% 70% L 20% 85%" stroke="var(--accent-cyan)" strokeWidth="2" opacity="0.5" />
        <path d="M 50% 70% L 35% 85%" stroke="var(--accent-cyan)" strokeWidth="2" opacity="0.5" />
        <path d="M 50% 70% L 50% 85%" stroke="var(--accent-cyan)" strokeWidth="2" opacity="0.5" />
        <path d="M 50% 70% L 65% 85%" stroke="var(--accent-cyan)" strokeWidth="2" opacity="0.5" />
        <path d="M 50% 70% L 80% 85%" stroke="var(--accent-cyan)" strokeWidth="2" opacity="0.5" />
      </svg>

      <div className="z-10 bg-[rgba(0,0,0,0.6)] border border-[var(--accent-cyan)] px-6 py-3 rounded text-center shadow-[0_0_15px_rgba(0,255,255,0.2)]">
        <div className="text-[var(--accent-cyan)] font-bold text-lg">中书省 (Zhongshu)</div>
        <div className="text-xs text-white/50">起草提案 (Drafting)</div>
      </div>

      <div className="z-10 bg-[rgba(0,0,0,0.6)] border border-[var(--accent-crimson)] px-6 py-3 rounded text-center shadow-[0_0_15px_rgba(255,51,102,0.2)]">
        <div className="text-[var(--accent-crimson)] font-bold text-lg flex items-center gap-2">
          门下省 (Menxia) <XCircle size={16} />
        </div>
        <div className="text-xs text-white/50">封驳审核 (Veto / Audit)</div>
      </div>

      <div className="z-10 bg-[rgba(0,0,0,0.6)] border border-[#00ff9d] px-6 py-3 rounded text-center shadow-[0_0_15px_rgba(0,255,157,0.2)]">
        <div className="text-[#00ff9d] font-bold text-lg">尚书省 (Shangshu)</div>
        <div className="text-xs text-white/50">统领执行 (Execution)</div>
      </div>

      <div className="z-10 w-full flex justify-between px-10 mt-8">
        {['吏部', '户部', '礼部', '兵部', '刑部', '工部'].map(bu => (
          <div key={bu} className="bg-[rgba(0,0,0,0.4)] border border-white/20 px-4 py-2 rounded text-center text-sm text-white/80">
            {bu}
          </div>
        ))}
      </div>
    </div>
  );

  const renderRomanTopology = () => (
    <div className="flex flex-col items-center justify-center w-full h-full relative p-8">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-cyan)" />
          </marker>
          <marker id="vetohead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-crimson)" />
          </marker>
        </defs>
        {/* Consular Veto */}
        <path d="M 35% 45% L 65% 45%" stroke="var(--accent-crimson)" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#vetohead)" markerStart="url(#vetohead)" />
        <text x="50%" y="43%" fill="var(--accent-crimson)" fontSize="12" dominantBaseline="middle" textAnchor="middle">相互否决 (Intercessio)</text>

        {/* Senate advising */}
        <path d="M 50% 25% L 35% 40%" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="2,2" />
        <path d="M 50% 25% L 65% 40%" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="2,2" />
        
        {/* Tribune Veto */}
        <path d="M 50% 75% L 35% 55%" stroke="var(--accent-crimson)" strokeWidth="3" markerEnd="url(#vetohead)" />
        <path d="M 50% 75% L 65% 55%" stroke="var(--accent-crimson)" strokeWidth="3" markerEnd="url(#vetohead)" />
      </svg>

      <div className="z-10 absolute top-[15%] bg-[rgba(0,0,0,0.6)] border border-[#00ff9d] px-6 py-3 rounded text-center">
        <div className="text-[#00ff9d] font-bold text-lg">元老院 (Senate)</div>
        <div className="text-xs text-white/50">战略建议 (Advisory)</div>
      </div>

      <div className="z-10 absolute top-[45%] left-[20%] bg-[rgba(0,0,0,0.6)] border border-[var(--accent-cyan)] px-6 py-3 rounded text-center">
        <div className="text-[var(--accent-cyan)] font-bold text-lg">执政官 A (Consul)</div>
        <div className="text-xs text-white/50">最高行政军事权</div>
      </div>

      <div className="z-10 absolute top-[45%] right-[20%] bg-[rgba(0,0,0,0.6)] border border-[var(--accent-cyan)] px-6 py-3 rounded text-center">
        <div className="text-[var(--accent-cyan)] font-bold text-lg">执政官 B (Consul)</div>
        <div className="text-xs text-white/50">最高行政军事权</div>
      </div>

      <div className="z-10 absolute top-[75%] bg-[rgba(0,0,0,0.6)] border border-[var(--accent-crimson)] px-6 py-3 rounded text-center">
        <div className="text-[var(--accent-crimson)] font-bold text-lg flex items-center justify-center gap-2">
          保民官 (Tribune) <ShieldCheck size={16} />
        </div>
        <div className="text-xs text-white/50">绝对否决权 (Absolute Veto)</div>
      </div>
    </div>
  );

  const renderDefaultTopology = () => (
    <div className="flex items-center justify-center h-full flex-col gap-4 text-white/40">
      <Network size={48} />
      <div>No custom topology visualizer defined for {regime} yet.</div>
    </div>
  );

  return (
    <div className="w-full h-[400px] glass-panel mt-6 overflow-hidden relative">
      <div className="absolute top-4 left-4 flex items-center gap-2 text-white/60 text-sm font-bold z-20">
        <GitPullRequest size={16} />
        AGENT ORCHESTRATION TOPOLOGY
      </div>
      
      {regime.includes('tang') ? renderTangTopology() : 
       regime.includes('roman-republic') ? renderRomanTopology() : 
       renderDefaultTopology()}
    </div>
  );
};
