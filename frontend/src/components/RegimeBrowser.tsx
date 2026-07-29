import React, { useState } from 'react';
import { Users, BarChart3, Network, Scroll, Workflow } from 'lucide-react';
import type { RegimeDetail } from '../types/api';
import OrgChart from './regime/OrgChart';
import ModeComparison from './regime/ModeComparison';
import { RelationshipNetwork } from './regime/RelationshipNetwork';
import { RegimeTopology } from './RegimeTopology';

interface RegimeBrowserProps {
  regimes: RegimeDetail[];
}

export const RegimeBrowser: React.FC<RegimeBrowserProps> = ({ regimes }) => {
  const [selectedSubTab, setSelectedSubTab] = useState<'org' | 'comparison' | 'network' | 'topology'>('topology');
  const [selectedRegime, setSelectedRegime] = useState<RegimeDetail | null>(regimes[0] || null);

  // Set default selected regime if none is selected yet and regimes array loads
  React.useEffect(() => {
    if (!selectedRegime && regimes.length > 0) {
      setSelectedRegime(regimes[0]);
    }
  }, [regimes, selectedRegime]);

  return (
    <div className="space-y-6 flex flex-col h-full animate-fade-in">
      
      {/* Sub Tabs Selection Bar */}
      <div className="glass-panel p-5 flex items-center justify-between gap-6 shrink-0 rounded-xl">
        
        {/* Info label */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(0,240,255,0.08)] border border-[var(--border-glow-cyan)] text-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)]">
            <Scroll size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">
              Regime Visualization Browser
            </h2>
            <span className="text-[10px] text-[var(--text-secondary)] font-mono block mt-1 tracking-wider">
              Form ②: Comparative academic analysis of 57 historical systems
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-3">
          
          <button
            onClick={() => setSelectedSubTab('org')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${
              selectedSubTab === 'org'
                ? 'bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users size={16} /> Org Chart
          </button>

          <button
            onClick={() => setSelectedSubTab('comparison')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${
              selectedSubTab === 'comparison'
                ? 'bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BarChart3 size={16} /> Pattern Comparison
          </button>

          <button
            onClick={() => setSelectedSubTab('network')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${
              selectedSubTab === 'network'
                ? 'bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Network size={16} /> Relationship Network
          </button>

          <button
            onClick={() => setSelectedSubTab('topology')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${
              selectedSubTab === 'topology'
                ? 'bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Network size={16} /> Topology
          </button>

          <button
            onClick={() => setSelectedSubTab('topology')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
              selectedSubTab === 'topology'
                ? 'bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] hover:border-[rgba(255,255,255,0.12)]'
            }`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 600 }}
          >
            <Workflow size={14} /> Topology
          </button>

        </div>

      </div>

      {/* Central Viewport */}
      <div className="flex-1 overflow-hidden relative">
        {selectedSubTab === 'org' && (
          <OrgChart
            regimes={regimes}
            selectedRegime={selectedRegime}
            onSelectRegime={setSelectedRegime}
          />
        )}

        {selectedSubTab === 'comparison' && (
          <ModeComparison regimes={regimes} />
        )}

        {selectedSubTab === 'network' && (
          <RelationshipNetwork regimes={regimes} />
        )}

        {selectedSubTab === 'topology' && (
          <div className="flex h-full gap-4">
            <div className="w-[200px] border-r border-[var(--border-subtle)] pr-4 flex flex-col gap-2 overflow-y-auto">
              {regimes.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRegime(r)}
                  className={`px-3 py-2 text-left rounded-lg text-sm transition-all ${
                    selectedRegime?.id === r.id 
                      ? 'bg-[rgba(0,255,255,0.15)] text-[#fff] border border-[var(--accent-cyan)] shadow-[0_0_8px_rgba(0,255,255,0.2)]' 
                      : 'text-white/50 hover:bg-[rgba(255,255,255,0.05)] border border-transparent'
                  }`}
                >
                  {typeof r.metadata.name === 'object' ? r.metadata.name.zh : (r.metadata.name || r.id)}
                </button>
              ))}
            </div>
            <div className="flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-[var(--accent-cyan)] mb-2 px-6">
                {(typeof selectedRegime?.metadata?.name === 'object' ? selectedRegime?.metadata?.name.zh : selectedRegime?.metadata?.name) || selectedRegime?.id} Orchestration
              </h3>
              <p className="text-sm text-white/50 mb-4 px-6">{selectedRegime?.metadata?.description?.en}</p>
              <RegimeTopology regime={selectedRegime?.id || 'china/tang'} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
export default RegimeBrowser;
