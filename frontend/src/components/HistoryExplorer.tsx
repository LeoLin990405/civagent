import React, { useState } from 'react';
import { History, Calendar, ShieldCheck, FileText, ChevronRight, Terminal, Search } from 'lucide-react';
import type { MatchSummary, MatchEvent, MatchMeta } from '../types/api';

function formatSediment(sediment: MatchMeta['sediment']): { label: string, status: 'saved' | 'rejected' | 'skipped' | 'error' | 'none', text: string } {
  if (!sediment) {
    return { label: 'None', status: 'none', text: 'No skill sedimentation recorded.' };
  }

  // If it's a string
  if (typeof sediment === 'string') {
    if (sediment === 'success') {
      return { label: 'Saved', status: 'saved', text: 'Skill extracted successfully.' };
    }
    if (sediment.startsWith('failed') || sediment.includes('error') || sediment.includes('fail')) {
      return { label: 'Failed', status: 'error', text: sediment };
    }
    return { label: 'Status', status: 'none', text: sediment };
  }

  // If it's an object
  if (typeof sediment === 'object') {
    if (sediment.saved) {
      const parts = String(sediment.saved).split('/');
      const filename = parts[parts.length - 1] || 'skill.md';
      let text = `Skill saved: ${filename}`;
      if (sediment.auditedBy) {
        text += ` (Audited by: ${sediment.auditedBy})`;
      }
      return { label: 'Saved', status: 'saved', text };
    }
    if (sediment.rejected) {
      let text = `Skill rejected: ${sediment.rejected}`;
      if (sediment.auditedBy) {
        text += ` (Audited by: ${sediment.auditedBy})`;
      }
      return { label: 'Rejected', status: 'rejected', text };
    }
    if (sediment.skipped) {
      return { label: 'Skipped', status: 'skipped', text: `Skill skipped: ${sediment.skipped}` };
    }
    if (sediment.error) {
      return { label: 'Error', status: 'error', text: `Error: ${sediment.error}` };
    }
  }

  return { label: 'Status', status: 'none', text: String(JSON.stringify(sediment)) };
}

function formatSkillEvent(e: MatchEvent): { title: string, desc: string, color: string } {
  if (e.status) {
    const title = `SKILL ${e.status.toUpperCase()}`;
    let desc = '';
    let color = 'var(--accent-cyan)'; // default cyan for saved
    if (e.status === 'saved') {
      const parts = (e.skillPath || '').split('/');
      const skillFile = parts[parts.length - 1] || 'skill.md';
      desc = `Successfully extracted & registered new skill: ${skillFile}`;
      if (e.auditedBy) {
        desc += ` (Audited by: ${e.auditedBy})`;
      }
    } else if (e.status === 'rejected') {
      desc = `Skill rejected: ${e.reason || 'does not meet criteria'}`;
      if (e.auditedBy) {
        desc += ` (Audited by: ${e.auditedBy})`;
      }
      color = 'var(--accent-crimson)'; // crimson
    } else if (e.status === 'skipped') {
      desc = `Skill skipped: ${e.reason || 'no novel patterns detected'}`;
      color = 'var(--accent-gold)'; // gold
    } else if (e.status === 'error') {
      desc = `Skill sedimentation error: ${e.reason || 'internal error'}`;
      color = 'var(--accent-crimson)'; // crimson
    }
    return { title, desc, color };
  }
  
  // Legacy fallback
  return {
    title: 'SKILL EXTRACTED',
    desc: e.text || 'Nous Hermes skill extracted successfully.',
    color: 'var(--accent-cyan)'
  };
}

interface HistoryExplorerProps {
  matches: MatchSummary[];
  onSelectMatch: (matchId: string) => void;
  activeMatchId?: string;
  activeMatchEvents: MatchEvent[];
}

export const HistoryExplorer: React.FC<HistoryExplorerProps> = ({
  matches,
  onSelectMatch,
  activeMatchId,
  activeMatchEvents,
}) => {
  const [filterRegime, setFilterRegime] = useState('');

  const getFormatBadgeStyle = (format: string) => {
    return format === 'structured'
      ? 'bg-[rgba(0,240,255,0.08)] text-[var(--accent-cyan)] border border-[rgba(0,240,255,0.2)]'
      : 'bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)] border border-[rgba(255,255,255,0.06)]';
  };

  const getExitCodeBadgeStyle = (code?: number) => {
    if (code === undefined) return 'bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border border-[rgba(255,255,255,0.06)]';
    return code === 0
      ? 'bg-[rgba(57,255,20,0.08)] text-[var(--accent-green)] border border-[rgba(57,255,20,0.25)]'
      : 'bg-[rgba(255,46,147,0.08)] text-[var(--accent-crimson)] border border-[rgba(255,46,147,0.25)]';
  };

  const getRoleStyleClass = (actor: string) => {
    const act = actor.toLowerCase();
    if (act.includes('emperor') || act.includes('consul') || act.includes('gensec') || act.includes('sheren') || act.includes('basileus') || act.includes('chengxiang')) {
      return 'role-coordinator';
    }
    if (act.includes('censor') || act.includes('tribune') || act.includes('patriarch') || act.includes('review') || act.includes('audit')) {
      return 'role-review';
    }
    if (act.includes('army') || act.includes('bingbu') || act.includes('works') || act.includes('engineering') || act.includes('taiwei')) {
      return 'role-engineering';
    }
    if (act.includes('research') || act.includes('senate') || act.includes('dromos')) {
      return 'role-research';
    }
    if (act.includes('hubu') || act.includes('finance') || act.includes('genikon') || act.includes('quaestor') || act.includes('gosplan')) {
      return 'role-data';
    }
    if (act.includes('gongbu') || act.includes('devops') || act.includes('domestikos') || act.includes('aedile') || act.includes('kgb')) {
      return 'role-devops';
    }
    if (act.includes('libu') || act.includes('content') || act.includes('pravda') || act.includes('protoasecretis')) {
      return 'role-content';
    }
    if (act.includes('xingbu') || act.includes('legal') || act.includes('praetor') || act.includes('tingwei') || act.includes('supreme')) {
      return 'role-legal';
    }
    return 'role-management';
  };

  // Filter matches based on search / filter inputs
  const filteredMatches = matches.filter(m => {
    if (!filterRegime) return true;
    const term = filterRegime.toLowerCase();
    const regime = m.meta?.regime || '';
    const matchId = m.id || '';
    const backend = m.meta?.backend || '';
    return (
      regime.toLowerCase().includes(term) ||
      matchId.toLowerCase().includes(term) ||
      backend.toLowerCase().includes(term)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* List Container */}
      <div className="lg:col-span-1 glass-panel p-6 flex flex-col h-[600px] overflow-hidden">
        
        {/* Title */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-[rgba(0,240,255,0.05)] border border-[var(--border-glow-cyan)] text-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)]">
            <History size={16} />
          </div>
          <h2 className="text-base font-bold uppercase tracking-wider text-[var(--text-primary)]">MATCH ARCHIVE</h2>
        </div>

        {/* Filter Input */}
        <div className="mb-5 shrink-0">
          <div className="flex items-center gap-2 bg-[var(--bg-surface-raised)] rounded-md border border-[var(--border-subtle)] px-3 py-2 focus-within:border-[var(--border-glow-cyan)] transition-colors shadow-[var(--shadow-glass)]">
            <Search size={14} className="text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by regime, ID or backend..."
              className="w-full bg-transparent border-none text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-0 p-0 placeholder-[var(--text-muted)]"
              value={filterRegime}
              onChange={(e) => setFilterRegime(e.target.value)}
            />
          </div>
        </div>

        {/* List of matches */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-fade-y">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-xs font-mono">
              No matches found.
            </div>
          ) : (
            filteredMatches.map((m) => {
              const isActive = activeMatchId === m.id;
              const date = new Date(m.mtime);
              const label = m.meta?.regime || 'legacy';

              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMatch(m.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isActive
                      ? 'bg-[var(--bg-glass-heavy)] border-[var(--border-glow-cyan)] shadow-[var(--shadow-glow-cyan)] relative overflow-hidden'
                      : 'bg-[var(--bg-surface-raised)] border-[var(--border-subtle)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-glass-medium)]'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)]"></div>}
                  <div className="space-y-2 max-w-[80%] pl-1">
                    
                    {/* Title Regime */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {label}
                      </span>
                      <span className={`role-badge ${getFormatBadgeStyle(m.format)}`}>
                        {m.format}
                      </span>
                    </div>

                    {/* Meta match stamp */}
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-[var(--text-muted)]" /> {date.toLocaleDateString()}
                      </span>
                      <span className="text-[var(--text-muted)] opacity-50">|</span>
                      <span>ID: <span className="text-[var(--accent-gold)]">{m.id.substring(0, 13)}</span></span>
                    </div>

                  </div>

                  <ChevronRight 
                    size={18} 
                    className={`text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)] transition-colors group-hover:translate-x-1 duration-300 ${isActive ? 'text-[var(--accent-cyan)] translate-x-1' : ''}`} 
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail / Playback Viewer */}
      <div className="lg:col-span-2 glass-panel p-0 flex flex-col h-[600px] overflow-hidden">
        {activeMatchId ? (
          <div className="flex flex-col h-full overflow-hidden relative">
            
            {/* Detail Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-glass-medium)] shrink-0 z-10 shadow-[var(--shadow-glass)]">
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]">
                  <Terminal size={12} className="animate-pulse" /> Active Match Playback
                </span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] font-mono">
                  ID: <span className="text-[var(--accent-cyan)]">{activeMatchId}</span>
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className={`role-badge px-3 py-1.5 ${getExitCodeBadgeStyle(matches.find(m => m.id === activeMatchId)?.meta?.exitCode)}`}>
                  Exit Code: {matches.find(m => m.id === activeMatchId)?.meta?.exitCode ?? '0 (OK)'}
                </span>
              </div>
            </div>

            {/* Main playback and skill timeline split */}
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 overflow-hidden">
              
              {/* Left Column: Logs Stream View */}
              <div className="flex flex-col overflow-hidden h-full border-r border-[var(--border-subtle)] bg-[#050507]">
                <div className="flex items-center gap-2.5 px-5 py-3 text-[var(--text-secondary)] font-bold text-[10px] uppercase tracking-widest border-b border-[var(--border-subtle)] bg-[var(--bg-glass-light)] z-10 shadow-[var(--shadow-glass)]">
                  <Terminal size={14} className="text-[var(--text-muted)]" />
                  <span>Telemetry Stream Logs</span>
                </div>
                <div className="flex-1 p-5 font-mono text-[12px] overflow-y-auto leading-relaxed scroll-fade-y space-y-4">
                  <div className="mb-4">
                    <span className="text-[var(--text-muted)] italic block">// Initializing match event manifest...</span>
                    <span className="text-[var(--accent-green)] font-bold block drop-shadow-[0_0_5px_rgba(5,255,161,0.3)]">SYSTEM: match stream opened successfully.</span>
                  </div>
                  
                  <div className="space-y-4">
                    {activeMatchEvents.length === 0 ? (
                      <span className="text-[var(--text-muted)] block italic">No events loaded for this match.</span>
                    ) : (
                      activeMatchEvents.map((e, idx) => {
                        if (e.type === 'chunk') {
                          return <span key={idx} className="block whitespace-pre-wrap text-[var(--text-secondary)]">{e.text}</span>;
                        }
                        if (e.type === 'turn') {
                          return (
                            <div key={idx} className="bg-[var(--bg-glass-light)] p-4 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-glass-hover)] transition-colors">
                              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--border-subtle)]">
                                <span className={`role-badge ${getRoleStyleClass(e.actor || 'agent')}`}>
                                  {e.actor || 'agent'}
                                </span>
                              </div>
                              <p className="text-[12px] text-[var(--text-primary)] whitespace-pre-wrap break-words">{e.text}</p>
                            </div>
                          );
                        }
                        return (
                          <div key={idx} className="text-[var(--text-secondary)]">
                            <span className="text-[var(--text-muted)] font-bold">[{e.type}]</span> {e.text}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Skill Sedimentation Timeline */}
              <div className="flex flex-col overflow-hidden h-full bg-[var(--bg-surface-raised)] relative">
                <div className="flex items-center gap-2.5 px-5 py-3 text-[var(--accent-cyan)] font-bold text-[10px] uppercase tracking-widest border-b border-[var(--border-subtle)] bg-[var(--bg-glass-light)] z-10 shadow-[var(--shadow-glass)]">
                  <ShieldCheck size={14} className="drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" />
                  <span>Sedimentation Timeline</span>
                </div>

                <div className="flex-1 p-6 overflow-y-auto scroll-fade-y space-y-6">
                  {(() => {
                    const matchMeta = matches.find(m => m.id === activeMatchId)?.meta;
                    const skillEvents = activeMatchEvents.filter(e => e.type === 'skill');
                    const skillsToDisplay = [...skillEvents];

                    if (skillsToDisplay.length === 0 && matchMeta?.sediment) {
                      const formatted = formatSediment(matchMeta.sediment);
                      if (formatted.status !== 'none') {
                        skillsToDisplay.push({
                          matchId: activeMatchId!,
                          ts: Date.now(),
                          type: 'skill',
                          seq: 999,
                          status: formatted.status as MatchEvent['status'],
                          text: formatted.text
                        });
                      }
                    }

                    if (skillsToDisplay.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] font-mono uppercase tracking-widest text-[10px] gap-4">
                          <div className="w-16 h-16 rounded-full border border-[var(--border-subtle)] flex items-center justify-center bg-[var(--bg-glass-light)]">
                            <ShieldCheck size={24} className="opacity-30" />
                          </div>
                          <span>No skills sedimented in this match.</span>
                        </div>
                      );
                    }

                    return skillsToDisplay.map((e, idx) => {
                      const formatted = formatSkillEvent(e);
                      return (
                        <div key={idx} className="relative pl-8 before:content-[''] before:absolute before:left-3 before:top-4 before:bottom-[-24px] before:w-px before:bg-[var(--border-subtle)] last:before:hidden">
                          <div
                            className="absolute left-[5px] top-1 w-[14px] h-[14px] rounded-full flex items-center justify-center shadow-[0_0_10px_currentColor] ring-4 ring-[var(--bg-surface-raised)]"
                            style={{ backgroundColor: formatted.color, color: formatted.color }}
                          >
                            <div className="w-1.5 h-1.5 bg-black rounded-full" />
                          </div>
                          <div className="glass-panel p-4" style={{ borderColor: `${formatted.color}40`, boxShadow: `0 4px 20px ${formatted.color}10` }}>
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor: `${formatted.color}20` }}>
                              <ShieldCheck size={14} style={{ color: formatted.color }} />
                              <span className="text-[10px] font-bold font-mono tracking-widest uppercase" style={{ color: formatted.color }}>STAGE: SEDIMENT (seq #{e.seq})</span>
                            </div>
                            <p className="text-[12px] leading-relaxed font-mono mt-2" style={{ color: formatted.color }}>
                              {formatted.desc}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-4 w-full relative">
            <div className="absolute inset-0 bg-[var(--bg-surface)] opacity-50 flex items-center justify-center">
              <div className="w-[300px] h-[300px] border border-[var(--border-subtle)] rounded-full border-dashed animate-[spin_60s_linear_infinite] opacity-30"></div>
            </div>
            <FileText size={48} className="text-[rgba(255,255,255,0.05)] relative z-10" />
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold relative z-10">Select a match from the archive list</span>
          </div>
        )}
      </div>

    </div>
  );
};
export default HistoryExplorer;
