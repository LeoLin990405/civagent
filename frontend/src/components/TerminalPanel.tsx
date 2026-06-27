import React, { useEffect, useRef, useState } from 'react';
import { Terminal, ArrowDown, Search, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { MatchEvent } from '../types/api';

interface TerminalPanelProps {
  regimeId: string;
  displayName: string;
  backend?: string;
  events: MatchEvent[];
  isStreaming?: boolean;
  status: 'running' | 'completed' | 'failed' | 'idle';
  sediment?: any;
}

function formatSediment(sediment: any): { label: string, status: 'saved' | 'rejected' | 'skipped' | 'error' | 'none', text: string } {
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

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  regimeId,
  displayName,
  backend = 'claude-3-5-sonnet',
  events = [],
  isStreaming = false,
  status,
  sediment,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeActor, setActiveActor] = useState<string | null>(null);

  // Auto scroll effect
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  // Track the most recent active actor
  useEffect(() => {
    if (events.length > 0) {
      const activeEvent = [...events]
        .reverse()
        .find(e => e.actor && e.type === 'turn');
      if (activeEvent?.actor) {
        setActiveActor(activeEvent.actor);
      }
    }
  }, [events]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
    setAutoScroll(isAtBottom);
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

  const filteredEvents = events.filter(e => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (e.actor && e.actor.toLowerCase().includes(term)) ||
      (e.text && e.text.toLowerCase().includes(term)) ||
      e.type.toLowerCase().includes(term)
    );
  });

  return (
    <div className="glass-panel glass-panel-cyan flex flex-col h-[500px] overflow-hidden relative">
      
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-[var(--bg-glass-medium)] border-b border-[var(--border-subtle)] shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(0,240,255,0.05)] border border-[var(--border-glow-cyan)] text-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)]">
            <Terminal size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-wide">{displayName}</h3>
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
              <span>{regimeId}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></span>
              <span className="text-[var(--accent-cyan)]">{backend}</span>
            </div>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-3">
          {status === 'running' && (
            <span className="live-badge">{isStreaming ? 'Streaming' : 'Live'}</span>
          )}
          {status === 'completed' && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--accent-green)] font-bold uppercase tracking-wider drop-shadow-[0_0_5px_rgba(5,255,161,0.5)]">
              <CheckCircle size={14} /> Complete
            </span>
          )}
          {status === 'failed' && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--accent-crimson)] font-bold uppercase tracking-wider drop-shadow-[0_0_5px_rgba(255,42,109,0.5)]">
              <AlertTriangle size={14} /> Failed
            </span>
          )}
          {status === 'idle' && (
            <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
              Standby
            </span>
          )}
        </div>
      </div>

      {/* Terminal Tools Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-surface-raised)] border-b border-[var(--border-subtle)] text-xs shrink-0 z-10 shadow-[var(--shadow-glass)]">
        <div className="flex items-center gap-3 max-w-[60%]">
          <span className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest">Active Link:</span>
          {activeActor ? (
            <span className={`role-badge ${getRoleStyleClass(activeActor)}`}>
              {activeActor}
            </span>
          ) : (
            <span className="text-[var(--text-muted)] text-[10px] font-mono">NO_CARRIER</span>
          )}
        </div>

        {/* Search tool */}
        <div className="flex items-center gap-2 bg-[var(--bg-surface)] rounded-md border border-[var(--border-subtle)] px-3 py-1.5 focus-within:border-[var(--border-glow-cyan)] transition-colors">
          <Search size={12} className="text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Filter stream..."
            className="w-32 bg-transparent border-none text-[11px] text-[var(--text-primary)] font-mono focus:outline-none focus:ring-0 p-0 placeholder-[var(--text-muted)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Terminal Output Display */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-5 font-mono text-[13px] leading-relaxed bg-[#050507] scroll-fade-y"
      >
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-3">
            <Terminal size={32} className="opacity-20" />
            <span className="uppercase tracking-widest text-[10px] font-bold">Awaiting telemetry...</span>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {filteredEvents.map((e, index) => {
              if (e.type === 'chunk') {
                return (
                  <span key={index} className="whitespace-pre-wrap break-all text-[var(--text-secondary)]">
                    {e.text}
                  </span>
                );
              }

              if (e.type === 'turn') {
                return (
                  <div key={index} className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-glass-light)] hover:bg-[var(--bg-glass-hover)] transition-colors log-entry-enter" style={{animationDelay: `${index * 0.05}s`}}>
                    <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-2">
                      <div className="flex items-center gap-3">
                        <span className={`role-badge ${getRoleStyleClass(e.actor || 'sys')}`}>
                          {e.actor || 'sys'}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">seq {e.seq}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] tracking-wider">
                        {new Date(e.ts).toLocaleTimeString(undefined, { hour12: false, fractionalSecondDigits: 3 })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-[var(--text-primary)]">
                      {e.text}
                    </p>
                  </div>
                );
              }

              if (e.type === 'skill' || e.type === 'judge') {
                if (e.type === 'skill') {
                  const formatted = formatSkillEvent(e);
                  return (
                    <div key={index} className="p-3.5 rounded-lg border flex items-start gap-3 log-entry-enter" style={{ background: `${formatted.color}0A`, border: `1px solid ${formatted.color}33` }}>
                      <ShieldCheck className="shrink-0" size={16} style={{ color: formatted.color }} />
                      <div>
                        <span className="font-bold uppercase tracking-widest text-[10px] block mb-1" style={{ color: formatted.color }}>
                          {formatted.title}
                        </span>
                        <p className="text-[12px] opacity-90" style={{ color: formatted.color }}>{formatted.desc}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={index} className="p-3.5 rounded-lg border border-[var(--border-glow-cyan)] bg-[rgba(0,240,255,0.05)] text-[var(--accent-cyan)] flex items-start gap-3 log-entry-enter shadow-[inset_0_0_15px_rgba(0,240,255,0.05)]">
                    <ShieldCheck className="shrink-0 text-[var(--accent-cyan)]" size={16} />
                    <div>
                      <span className="font-bold uppercase tracking-widest text-[10px] block mb-1">
                        {e.type.toUpperCase()} INTERCEPT DETECTED
                      </span>
                      <p className="text-[12px] opacity-90">{e.text}</p>
                    </div>
                  </div>
                );
              }

              if (e.type === 'match_start' || e.type === 'match_end') {
                return (
                  <div key={index} className="py-3 border-y border-[var(--border-subtle)] text-center text-[var(--accent-gold)] text-[10px] tracking-widest uppercase font-bold bg-[rgba(255,215,0,0.02)] log-entry-enter">
                    {e.text} [SYNC #{e.seq}]
                  </div>
                );
              }

              return (
                <div key={index} className="text-[var(--text-secondary)] log-entry-enter">
                  <span className="text-[var(--text-muted)] font-bold">[{e.type}]</span> {e.text}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Auto Scroll indicator */}
      {!autoScroll && filteredEvents.length > 0 && (
        <button
          onClick={() => setAutoScroll(true)}
          className="absolute bottom-16 right-6 flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest uppercase text-black bg-[var(--accent-cyan)] hover:bg-white border border-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)] rounded-full transition-all hover:scale-105 z-20"
        >
          <ArrowDown size={14} /> Tethers Active (Scroll)
        </button>
      )}

      {/* Sediment sedimentation tag */}
      {status === 'completed' && sediment !== undefined && (
        <div className="px-5 py-3 bg-[var(--bg-surface-raised)] border-t border-[var(--border-subtle)] text-[10px] flex items-center justify-between shrink-0 z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
          <span className="text-[var(--text-muted)] font-bold tracking-widest uppercase">Memory Sedimentation:</span>
          {(() => {
            const formatted = formatSediment(sediment);
            if (formatted.status === 'error' || formatted.status === 'rejected') {
              return <span className="text-[var(--accent-crimson)] font-mono font-bold drop-shadow-[0_0_3px_var(--accent-crimson)]">{formatted.text}</span>;
            }
            if (formatted.status === 'skipped') {
              return <span className="text-[var(--accent-gold)] font-mono font-bold">{formatted.text}</span>;
            }
            return (
              <span className="text-[var(--accent-cyan)] flex items-center gap-1.5 font-bold drop-shadow-[0_0_3px_var(--accent-cyan)] font-mono">
                <ShieldCheck size={13} /> {formatted.text}
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
};
export default TerminalPanel;
