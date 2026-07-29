import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HelpCircle, Network } from 'lucide-react';
import type { RegimeDetail } from '../../types/api';

interface RelationshipNetworkProps {
  regimes: RegimeDetail[];
}

export const RelationshipNetwork: React.FC<RelationshipNetworkProps> = ({ regimes }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredRegime, setHoveredRegime] = useState<RegimeDetail | null>(null);
  const [connections, setConnections] = useState<Array<{ from: { x: number; y: number }; to: { x: number; y: number }; id: string }>>([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Handle window resize to re-draw connection paths
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updatePaths = useCallback(() => {
    if (!containerRef.current || !hoveredRegime) {
      setConnections([]);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const fromEl = document.getElementById(`node-${hoveredRegime.id.replace(/\//g, '-')}`);
    if (!fromEl) return;

    const fromRect = fromEl.getBoundingClientRect();
    const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
    const fromY = fromRect.top - containerRect.top + fromRect.height / 2;

    const newConnections: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; id: string }> = [];

    // Find regimes sharing >= 1 tag
    const sharedRegimes = regimes.filter(r =>
      r.id !== hoveredRegime.id &&
      r.metadata?.tags?.some(t => hoveredRegime.metadata?.tags?.includes(t))
    );

    sharedRegimes.forEach(r => {
      const toEl = document.getElementById(`node-${r.id.replace(/\//g, '-')}`);
      if (toEl) {
        const toRect = toEl.getBoundingClientRect();
        const toX = toRect.left - containerRect.left + toRect.width / 2;
        const toY = toRect.top - containerRect.top + toRect.height / 2;
        newConnections.push({
          from: { x: fromX, y: fromY },
          to: { x: toX, y: toY },
          id: r.id
        });
      }
    });

    setConnections(newConnections);
  }, [hoveredRegime, regimes]);

  // Update connection curves whenever hovered node changes
  useEffect(() => {
    updatePaths();
  }, [hoveredRegime, windowWidth, updatePaths]);

  const chinaRegimes = regimes.filter(r => r.metadata?.region === 'china');
  const globalRegimes = regimes.filter(r => r.metadata?.region === 'global');

  // Node size scaling positive to agentCount
  const getNodeSizeStyle = (count?: number) => {
    const num = count || 5;
    if (num >= 8) return { scale: 'scale-105', padding: 'px-3 py-1.5', font: 'text-xs' };
    if (num >= 6) return { scale: 'scale-100', padding: 'px-2.5 py-1', font: 'text-[11px]' };
    return { scale: 'scale-95', padding: 'px-2 py-0.5', font: 'text-[10px]' };
  };

  return (
    <div className="flex flex-col h-[600px] overflow-hidden">
      
      {/* Description header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] shrink-0 mb-6">
        <div className="flex items-center gap-3 text-[var(--accent-cyan)] font-heading">
          <Network size={18} className="drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" />
          <h4 className="text-sm font-black uppercase tracking-widest drop-shadow-[0_0_3px_rgba(0,240,255,0.3)]">
            CIVILIZATION INFLUENCE & SHARED RELATIONSHIP MAP
          </h4>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] italic font-mono flex items-center gap-1.5 bg-[var(--bg-glass-light)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
          <HelpCircle size={12} /> Hover a node to visualize shared tags linkages
        </span>
      </div>

      {/* Network split view */}
      <div 
        ref={containerRef}
        className="flex-1 grid grid-cols-5 gap-6 overflow-hidden relative select-none"
      >
        
        {/* Dynamic SVG connection paths container */}
        {hoveredRegime && connections.length > 0 && (
          <svg 
            className="absolute inset-0 pointer-events-none z-10 w-full h-full"
          >
            {connections.map((c) => {
              // Draw a smooth curved Bezier connection path instead of direct rigid lines
              const midX = (c.from.x + c.to.x) / 2;
              const pathD = `M ${c.from.x} ${c.from.y} C ${midX} ${c.from.y}, ${midX} ${c.to.y}, ${c.to.x} ${c.to.y}`;
              
              return (
                <g key={c.id}>
                  {/* Glowing wide backing path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="var(--accent-cyan)"
                    strokeOpacity={0.15}
                    strokeWidth={6}
                    className="animate-pulse"
                  />
                  {/* Sharp core path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="var(--accent-cyan)"
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    className="animate-[dash_30s_linear_infinite]"
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Column 1 & 2: China Dynasties (flex columns) */}
        <div 
          className="col-span-2 overflow-y-auto max-h-full space-y-4 p-4 glass-panel bg-[var(--bg-glass-heavy)] border-[var(--border-glow-cyan)] shadow-[inset_var(--shadow-glass)] scroll-fade-y rounded-xl" 
        >
          <span className="text-[10px] text-[var(--accent-cyan)] font-mono font-black tracking-widest block uppercase drop-shadow-[0_0_3px_rgba(0,240,255,0.5)] border-b border-[var(--border-subtle)] pb-2 mb-2">
            CHINA REGIONS
          </span>
          <div className="flex flex-wrap gap-3 content-start">
            {chinaRegimes.map((r) => {
              const name = r.id.split('/').pop()?.replace('-', ' ') || '';
              const size = getNodeSizeStyle(r.metadata?.agentCount);
              const isHovered = hoveredRegime?.id === r.id;
              const isConnected = connections.some(c => c.id === r.id);

              return (
                <div
                  key={r.id}
                  id={`node-${r.id.replace(/\//g, '-')}`}
                  onMouseEnter={() => setHoveredRegime(r)}
                  onMouseLeave={() => setHoveredRegime(null)}
                  className={`rounded-full border font-mono font-black transition-all cursor-pointer whitespace-nowrap duration-300 ${size.padding} ${size.font} ${size.scale} ${
                    isHovered
                      ? 'bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)] z-20 scale-110'
                      : isConnected
                      ? 'bg-[var(--bg-glass-medium)] border-[var(--border-glow-cyan)] text-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)] z-20 scale-105'
                      : 'bg-[var(--bg-surface-raised)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent-cyan)] hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-glow-cyan)]'
                  }`}
                >
                  {name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3 & 4: Global Empires */}
        <div 
          className="col-span-2 overflow-y-auto max-h-full space-y-4 p-4 glass-panel bg-[var(--bg-glass-heavy)] border-[var(--border-glow-purple)] shadow-[inset_var(--shadow-glass)] scroll-fade-y rounded-xl" 
        >
          <span className="text-[10px] text-[var(--accent-purple)] font-mono font-black tracking-widest block uppercase drop-shadow-[0_0_3px_rgba(189,0,255,0.5)] border-b border-[var(--border-subtle)] pb-2 mb-2">
            GLOBAL REGIONS
          </span>
          <div className="flex flex-wrap gap-3 content-start">
            {globalRegimes.map((r) => {
              const name = r.id.split('/').pop()?.replace('-', ' ') || '';
              const size = getNodeSizeStyle(r.metadata?.agentCount);
              const isHovered = hoveredRegime?.id === r.id;
              const isConnected = connections.some(c => c.id === r.id);

              return (
                <div
                  key={r.id}
                  id={`node-${r.id.replace(/\//g, '-')}`}
                  onMouseEnter={() => setHoveredRegime(r)}
                  onMouseLeave={() => setHoveredRegime(null)}
                  className={`rounded-full border font-mono font-black transition-all cursor-pointer whitespace-nowrap duration-300 ${size.padding} ${size.font} ${size.scale} ${
                    isHovered
                      ? 'bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)] z-20 scale-110'
                      : isConnected
                      ? 'bg-[var(--bg-glass-medium)] border-[var(--border-glow-cyan)] text-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)] z-20 scale-105'
                      : 'bg-[var(--bg-surface-raised)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent-purple)] hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-glow-purple)]'
                  }`}
                >
                  {name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 5: Right sidebar detailed hovered node tooltips */}
        <div 
          className="col-span-1 glass-panel p-5 bg-[var(--bg-glass-heavy)] border-[var(--border-subtle)] flex flex-col justify-center h-full z-20 rounded-xl shadow-[var(--shadow-glass)]"
        >
          {hoveredRegime ? (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-[var(--border-subtle)] pb-3">
                <span className="text-[10px] text-[var(--text-muted)] font-mono font-bold uppercase tracking-widest block mb-1">HOVER INSPECTOR</span>
                <h4 className="text-sm font-black text-[var(--accent-cyan)] uppercase font-mono tracking-wider drop-shadow-[0_0_3px_rgba(0,240,255,0.3)]">
                  {hoveredRegime.id.split('/').pop()?.replace('-', ' ')}
                </h4>
              </div>

              <div className="space-y-4 text-xs text-[var(--text-secondary)] font-mono">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-1">ERA:</span>
                  <span className="text-[var(--text-primary)] font-bold block bg-[var(--bg-glass-light)] px-2 py-1 rounded inline-block border border-[var(--border-subtle)]">{hoveredRegime.metadata?.era?.en || 'Ancient'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-1">PATTERN:</span>
                  <span className="text-[var(--accent-purple)] font-black tracking-wide block bg-[var(--bg-glass-light)] px-2 py-1 rounded inline-block border border-[var(--border-glow-purple)]">{hoveredRegime.metadata?.orchestrationPattern}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-1">AGENT TEAMS:</span>
                  <span className="text-[var(--accent-gold)] font-black block bg-[var(--bg-glass-light)] px-2 py-1 rounded inline-block border border-[var(--border-glow-gold)]">{hoveredRegime.metadata?.agentCount || 5} nodes</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-2">INFLUENCE TAGS:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(hoveredRegime.metadata?.tags || []).map((tag, idx) => (
                      <span key={idx} className="text-[9px] font-bold bg-[var(--bg-glass-medium)] text-[var(--accent-cyan)] px-2 py-1 rounded-md border border-[var(--border-glow-cyan)] uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-[var(--text-muted)] text-xs space-y-4 p-4 flex flex-col items-center">
              <Network size={32} className="text-[rgba(255,255,255,0.1)] drop-shadow-[0_0_5px_rgba(255,255,255,0.05)]" />
              <span className="font-bold tracking-wider leading-relaxed">Hover a regime node to analyze shared tags connections timeline.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default RelationshipNetwork;
