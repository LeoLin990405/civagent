import React, { useState } from 'react';
import { BookOpen, Globe, Star, Info } from 'lucide-react';
import type { RegimeDetail } from '../types/api';

interface CodexBrowserProps {
  regimes: RegimeDetail[];
}

export const CodexBrowser: React.FC<CodexBrowserProps> = ({ regimes }) => {
  const [selectedPattern, setSelectedPattern] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegime, setSelectedRegime] = useState<RegimeDetail | null>(null);

  const patterns = [
    { id: 'all', name: 'All Patterns' },
    { id: 'centralized', name: 'Centralized' },
    { id: 'checks-and-balances', name: 'Checks & Balances' },
    { id: 'democratic', name: 'Democratic' },
    { id: 'dual-track', name: 'Dual-Track' },
    { id: 'federation', name: 'Federation' },
    { id: 'theocratic', name: 'Theocratic' },
  ];

  const filteredRegimes = regimes.filter(r => {
    const pattern = r.metadata?.orchestrationPattern || '';
    const name = r.metadata?.id || '';
    const tags = r.metadata?.tags || [];
    
    const matchesPattern = selectedPattern === 'all' || pattern === selectedPattern;
    const matchesSearch = 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesPattern && matchesSearch;
  });

  const getPatternBadgeColor = (pattern: string) => {
    switch (pattern) {
      case 'centralized': return 'text-[var(--accent-crimson)] bg-[rgba(255,46,147,0.06)] border-[rgba(255,46,147,0.25)]';
      case 'checks-and-balances': return 'text-[var(--accent-gold)] bg-[rgba(255,215,0,0.06)] border-[rgba(255,215,0,0.25)]';
      case 'democratic': return 'text-[var(--accent-cyan)] bg-[rgba(0,240,255,0.06)] border-[rgba(0,240,255,0.25)]';
      case 'dual-track': return 'text-purple-300 bg-[rgba(189,0,255,0.06)] border-[rgba(189,0,255,0.25)]';
      case 'federation': return 'text-[var(--accent-green)] bg-[rgba(57,255,20,0.06)] border-[rgba(57,255,20,0.25)]';
      case 'theocratic': return 'text-amber-400 bg-[rgba(251,191,36,0.06)] border-[rgba(251,191,36,0.25)]';
      default: return 'text-[var(--text-secondary)] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Bar */}
      <div className="glass-panel p-5 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 rounded-xl">
        
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Search regimes (e.g. tang, qin, roman)..."
            className="w-full text-sm bg-[var(--bg-glass-light)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 focus:border-[var(--accent-cyan)] focus:shadow-[var(--shadow-glow-cyan)] transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Pattern Selectors */}
        <div className="flex flex-wrap gap-3">
          {patterns.map((p) => {
            const isSelected = selectedPattern === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPattern(p.id)}
                className={`px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${
                  isSelected
                    ? 'bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Regimes Grid */}
        <div className="lg:col-span-2 space-y-5">
          
          <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">
            <Globe size={16} />
            <span>REGIMES INDEX ({filteredRegimes.length})</span>
          </div>

          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[580px] overflow-y-auto pr-2 scroll-fade-y" 
          >
            {filteredRegimes.map((r) => {
              const isSelected = selectedRegime?.id === r.id;
              const name = r.id.split('/').pop() || '';
              const region = r.id.split('/')[0] || '';

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRegime(r)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer glass-panel flex flex-col justify-between h-44 group relative overflow-hidden ${
                    isSelected
                      ? 'bg-[var(--bg-glass-medium)] border-[var(--border-glow-cyan)] shadow-[var(--shadow-glow-cyan)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-surface-raised)]'
                  }`}
                >
                  {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)]"></div>}
                  <div className="space-y-2 relative z-10">
                    
                    {/* Header: Epoch and tags */}
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono font-bold tracking-widest">
                      <span className="uppercase text-[var(--accent-cyan)] drop-shadow-[0_0_3px_rgba(0,240,255,0.3)]">{region}</span>
                      <span>{r.metadata?.epoch || 'Ancient'}</span>
                    </div>

                    {/* Regime Name */}
                    <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-wide group-hover:text-[var(--accent-cyan)] transition-colors">
                      {name.replace('-', ' ')}
                    </h3>

                    {/* Tag list */}
                    <div className="flex flex-wrap gap-2">
                      {(r.metadata?.tags || []).slice(0, 3).map((tag, tagIdx) => (
                        <span key={tagIdx} className="text-[10px] bg-[var(--bg-glass-light)] border border-[var(--border-subtle)] px-2 py-0.5 rounded font-mono text-[var(--text-secondary)] font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>

                  </div>

                  {/* Footer: Pattern Badge and Learned Skills Count */}
                  <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 mt-3 relative z-10">
                    <span className={`role-badge ${getPatternBadgeColor(r.metadata?.orchestrationPattern)}`}>
                      {r.metadata?.orchestrationPattern}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 font-bold font-mono">
                      <Star size={14} className="text-[var(--accent-cyan)] drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" />
                      {r.skills?.length || 0} skills
                    </span>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Selected Regime Inspector */}
        <div className="lg:col-span-1 glass-panel p-6 flex flex-col h-[580px] overflow-hidden rounded-xl bg-[var(--bg-glass-heavy)] border-[var(--border-subtle)] relative">
          {selectedRegime ? (
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-subtle)] shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[rgba(189,0,255,0.1)] border border-[var(--border-glow-purple)] text-[var(--accent-purple)] shadow-[var(--shadow-glow-purple)]">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-widest">
                    {selectedRegime.id.split('/').pop()?.replace('-', ' ')}
                  </h3>
                  <span className="text-xs text-[var(--text-muted)] font-mono block mt-1 font-bold">
                    PATTERN: <span className="text-[var(--accent-purple)]">{selectedRegime.metadata?.orchestrationPattern}</span>
                  </span>
                </div>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 mt-5 scroll-fade-y text-sm">
                
                {/* Org Chart Teaser */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black block border-l-2 border-[var(--accent-cyan)] pl-2">
                    SYSTEM PROFILE & CITATION
                  </span>
                  <div className="bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)] font-mono text-xs max-h-48 overflow-y-auto text-[var(--accent-cyan)] shadow-[inset_var(--shadow-glass)]">
                    {selectedRegime.identity ? (
                      selectedRegime.identity.split('\n').slice(0, 15).join('\n')
                    ) : (
                      <span className="text-[var(--text-muted)] italic">No specific system data seed available.</span>
                    )}
                    <span className="text-[var(--text-muted)] block mt-3 text-[10px]">... (view identity templates in regimes/ directory)</span>
                  </div>
                </div>

                {/* Soul Code */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black block border-l-2 border-[var(--accent-purple)] pl-2">
                    SOUL & ALIGNMENT CRITERIA
                  </span>
                  <div className="bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)] font-mono text-xs max-h-48 overflow-y-auto text-[var(--accent-purple)] shadow-[inset_var(--shadow-glass)]">
                    {selectedRegime.soul ? (
                      selectedRegime.soul.split('\n').slice(0, 10).join('\n')
                    ) : (
                      <span className="text-[var(--text-muted)] italic">No explicit behaviors mapped.</span>
                    )}
                  </div>
                </div>

                {/* Skill List */}
                <div className="space-y-3">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black block border-l-2 border-[var(--accent-gold)] pl-2">
                    SEDIMENTED SKILLS ({selectedRegime.skills?.length || 0})
                  </span>
                  {selectedRegime.skills && selectedRegime.skills.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRegime.skills.map((s, sIdx) => (
                        <div key={sIdx} className="bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-glow-cyan)] font-mono text-xs flex flex-col gap-1 shadow-[var(--shadow-glow-cyan)]">
                          <span className="text-[var(--accent-cyan)] font-bold">{s.filename}</span>
                          <span className="text-[var(--text-secondary)] text-[10px]">YAML schema compliant sedimentation</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] italic text-xs">
                      No skills sedimented yet. Run a v5 match to extract patterns!
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-4 text-center p-6">
              <Info size={48} className="text-[var(--text-muted)] drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
              <span className="text-sm font-bold tracking-wide">Select a regime card on the left to inspect its mapped organization charts, rules, and skills inventory.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default CodexBrowser;
