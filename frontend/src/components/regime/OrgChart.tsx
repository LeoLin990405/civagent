import React, { useEffect, useState } from 'react';
import { ShieldAlert, Users, Award, Loader2 } from 'lucide-react';
import type { RegimeDetail } from '../../types/api';
import type { IdentityRole, IdentityData } from '../../types/regime';

interface OrgChartProps {
  regimes: RegimeDetail[];
  selectedRegime: RegimeDetail | null;
  onSelectRegime: (regime: RegimeDetail) => void;
}

export const OrgChart: React.FC<OrgChartProps> = ({
  regimes,
  selectedRegime,
  onSelectRegime,
}) => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<IdentityRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch identity MD whenever active regime changes
  useEffect(() => {
    if (!selectedRegime) {
      setRoles([]);
      return;
    }

    const fetchIdentity = async () => {
      setLoading(true);
      try {
        const parts = selectedRegime.id.split('/');
        if (parts.length < 2) {
          console.warn('Invalid selected regime ID format:', selectedRegime.id);
          setRoles([]);
          setLoading(false);
          return;
        }
        const region = parts[0];
        const id = parts[1];
        
        const res = await fetch(`/api/regimes/${region}/${id}/identity`);
        if (res.ok) {
          const data: IdentityData = await res.json();
          
          if (data.raw) {
            const parsed = parseIdentityRoles(data.raw);
            setRoles(parsed);
          } else {
            setRoles([]);
          }
        }
      } catch (e) {
        console.error('Failed to fetch identity MD:', e);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIdentity();
  }, [selectedRegime]);

  // Parse markdown roles table
  const parseIdentityRoles = (rawMarkdown: string): IdentityRole[] => {
    const lines = rawMarkdown.split('\n');
    const parsedRoles: IdentityRole[] = [];
    let inTable = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const parts = trimmed.split('|').map(p => p.trim()).filter(Boolean);
        
        // Header detection
        if (trimmed.toLowerCase().includes('agent id') || trimmed.toLowerCase().includes('ai 职责')) {
          inTable = true;
          continue;
        }
        
        // Split separator
        if (trimmed.includes('---')) {
          continue;
        }
        
        if (inTable && parts.length >= 3) {
          parsedRoles.push({
            roleName: parts[0] || '',
            agentId: (parts[1] || '').replace(/`/g, ''),
            responsibility: parts[2] || '',
            model: (parts[3] || '').replace(/`/g, ''),
          });
        }
      } else if (inTable) {
        // Exited table - stop parsing
        break;
      }
    }
    return parsedRoles;
  };

  // Group regimes for sidebar listing
  const filteredRegimes = regimes.filter(r => 
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chinaRegimes = filteredRegimes.filter(r => r.metadata?.region === 'china');
  const globalRegimes = filteredRegimes.filter(r => r.metadata?.region === 'global');

  // Segregate roles into Coordinators (Emperor/Consul/Gensec/Co-decision peers) and Executors
  // Supports multiple peer/co-decision top-level roles (e.g. Council/Parliament/Commission co-decision in global/eu)
  const coordinatorRoles = roles.filter(r => 
    r.responsibility.toLowerCase().includes('coordinator') || 
    r.responsibility.toLowerCase().includes('起草') || 
    r.responsibility.toLowerCase().includes('总管') ||
    r.responsibility.toLowerCase().includes('调度') ||
    r.responsibility.toLowerCase().includes('co-decision') ||
    r.responsibility.toLowerCase().includes('decider') ||
    r.responsibility.toLowerCase().includes('decision-maker') ||
    r.responsibility.toLowerCase().includes('decision maker') ||
    r.responsibility.toLowerCase().includes('co-legislat') ||
    r.responsibility.toLowerCase().includes('proposes legislation') ||
    r.responsibility.toLowerCase().includes('propose legislation')
  );

  const finalCoordinators =
    coordinatorRoles.length > 0 ? coordinatorRoles : roles.length > 0 ? [roles[0]] : [];
  const coordinatorIds = finalCoordinators.map(c => c.agentId);
  const executorRoles = roles.filter(r => !coordinatorIds.includes(r.agentId));

  const getRoleBadgeStyle = (resp: string) => {
    const r = resp.toLowerCase();
    if (r.includes('review') || r.includes('审核') || r.includes('监察')) return 'role-review';
    if (r.includes('code') || r.includes('开发') || r.includes('工程')) return 'role-engineering';
    if (r.includes('devops') || r.includes('运维') || r.includes('部署')) return 'role-devops';
    return 'role-management';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
      
      {/* Sidebar - Regimes Selector */}
      <div className="lg:col-span-1 glass-panel p-5 flex flex-col h-full max-h-[600px] overflow-hidden rounded-xl">
        
        {/* Search */}
        <div className="mb-5 shrink-0">
          <input
            type="text"
            placeholder="Search regimes..."
            className="w-full text-sm bg-[var(--bg-glass-light)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 focus:border-[var(--accent-cyan)] focus:shadow-[var(--shadow-glow-cyan)] transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* List scroll */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 scroll-fade-y">
          
          {/* China Dynasties */}
          {chinaRegimes.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-[var(--accent-cyan)] font-mono font-bold uppercase tracking-widest block mb-1">
                CHINA DYNASTIES ({chinaRegimes.length})
              </span>
              <div className="space-y-1.5">
                {chinaRegimes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onSelectRegime(r)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide border transition-all ${
                      selectedRegime?.id === r.id
                        ? 'bg-[var(--bg-glass-medium)] border-[var(--border-glow-cyan)] text-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)]'
                        : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-glass-light)]'
                    }`}
                  >
                    {r.id.split('/').pop()?.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Global Empires */}
          {globalRegimes.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-[var(--accent-purple)] font-mono font-bold uppercase tracking-widest block mb-1">
                GLOBAL EMPIRES ({globalRegimes.length})
              </span>
              <div className="space-y-1.5">
                {globalRegimes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onSelectRegime(r)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide border transition-all ${
                      selectedRegime?.id === r.id
                        ? 'bg-[var(--bg-glass-medium)] border-[var(--border-glow-purple)] text-[var(--accent-purple)] shadow-[var(--shadow-glow-purple)]'
                        : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-glass-light)]'
                    }`}
                  >
                    {r.id.split('/').pop()?.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Main Org Chart Workspace */}
      <div className="lg:col-span-3 glass-panel p-6 flex flex-col h-full max-h-[600px] overflow-hidden rounded-xl">
        {selectedRegime ? (
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] shrink-0">
              <div>
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-widest">
                  {selectedRegime.id.split('/').pop()?.replace('-', ' ')} Organizational Architecture
                </h3>
                <span className="text-sm text-[var(--text-secondary)] font-mono block mt-1 tracking-wider">
                  EPOCH: {selectedRegime.metadata?.era?.en || 'Ancient'} · PATTERN: <span className="text-[var(--text-primary)]">{selectedRegime.metadata?.orchestrationPattern}</span>
                </span>
              </div>
              <span className="live-badge">Form ② Viz</span>
            </div>

            {/* Tree Flow / Content Workspace */}
            <div className="flex-1 overflow-y-auto p-2 mt-6 relative scroll-fade-y">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-muted)]">
                  <Loader2 className="animate-spin text-[var(--accent-cyan)] drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" size={40} />
                  <span className="font-bold tracking-widest uppercase text-sm">Compiling historical identity manifests...</span>
                </div>
              ) : roles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-muted)]">
                  <ShieldAlert size={48} className="text-[rgba(255,255,255,0.1)]" />
                  <span className="font-bold tracking-widest uppercase text-sm">IDENTITY.md role mappings not loaded or empty.</span>
                </div>
              ) : (
                <div className="space-y-12 animate-fade-in">
                  
                  {/* CSS Hierarchical Flow diagram */}
                  <div className="flex flex-col items-center">
                    
                    {/* Coordinators Grid (supports single or co-decision peers) */}
                    {finalCoordinators.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-6 w-full mb-4">
                        {finalCoordinators.map((coord) => (
                          <div 
                            key={coord.agentId}
                            className="glass-panel glass-panel-gold p-5 text-center w-[280px] relative transition-transform hover:-translate-y-1 hover:shadow-[var(--shadow-glow-gold)] border-[var(--border-glow-gold)]" 
                          >
                            <span className="text-[10px] text-[var(--accent-gold)] font-black block mb-2 font-heading uppercase tracking-widest flex items-center justify-center gap-2 drop-shadow-[0_0_3px_rgba(255,215,0,0.5)]">
                              <Award size={14} fill="var(--accent-gold)" /> COORDINATOR / DECIDER
                            </span>
                            <h4 className="text-base font-black text-[var(--text-primary)] mb-1 uppercase">{coord.roleName}</h4>
                            <code className="text-xs text-[var(--accent-gold)] font-mono block mb-2">{coord.agentId}</code>
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{coord.responsibility}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Vertical connecting line */}
                    {executorRoles.length > 0 && (
                      <div className="w-1 h-12 bg-gradient-to-b from-[var(--accent-gold)] to-[var(--accent-cyan)] shadow-[0_0_5px_rgba(0,240,255,0.5)] rounded-full mb-4"></div>
                    )}

                    {/* Executors Horizontal Grid */}
                    {executorRoles.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-5 w-full">
                        {executorRoles.map((exec) => (
                          <div 
                            key={exec.agentId} 
                            className="glass-panel p-4 text-center w-[240px] transition-transform hover:-translate-y-1 hover:border-[var(--border-glow-cyan)] hover:shadow-[var(--shadow-glow-cyan)] relative bg-[var(--bg-surface-raised)] border-[var(--border-subtle)]"
                          >
                            <span className={`role-badge ${getRoleBadgeStyle(exec.responsibility)}`}>
                              {exec.responsibility.includes('Review') || exec.responsibility.includes('审核') ? 'REVIEWER' : 'EXECUTOR'}
                            </span>
                            <h5 className="text-sm font-black text-[var(--text-primary)] mb-1 mt-2 uppercase">{exec.roleName}</h5>
                            <code className="text-[10px] text-[var(--accent-cyan)] font-mono block mb-2">{exec.agentId}</code>
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{exec.responsibility}</p>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Tabular Details Section */}
                  <div className="glass-panel p-6 bg-[var(--bg-glass-medium)] border-[var(--border-subtle)] rounded-xl shadow-[inset_var(--shadow-glass)]">
                    <div className="flex items-center gap-3 text-[var(--accent-cyan)] mb-4 border-b border-[var(--border-subtle)] pb-3">
                      <Users size={18} />
                      <h4 className="font-heading font-black uppercase tracking-widest text-sm drop-shadow-[0_0_3px_rgba(0,240,255,0.3)]">
                        ROLE MAPPING DETAILS & MODEL HIERARCHY
                      </h4>
                    </div>

                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                          <th className="pb-3 px-2">Historical Role</th>
                          <th className="pb-3 px-2">Agent ID</th>
                          <th className="pb-3 px-2">AI Responsibility</th>
                          <th className="pb-3 px-2 text-right">Recommended Model</th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--text-secondary)]">
                        {roles.map((role) => (
                          <tr key={role.agentId} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-glass-light)] transition-colors">
                            <td className="py-3 px-2 font-sans font-bold text-[var(--text-primary)]">{role.roleName}</td>
                            <td className="py-3 px-2 text-[var(--accent-cyan)]">{role.agentId}</td>
                            <td className="py-3 px-2 text-xs font-sans text-[var(--text-secondary)] max-w-[300px] truncate" title={role.responsibility}>{role.responsibility}</td>
                            <td className="py-3 px-2 text-right text-[var(--accent-purple)] font-bold">{role.model || 'Default'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-4 text-center p-8">
            <Users size={64} className="text-[rgba(255,255,255,0.1)] drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]" />
            <span className="text-lg font-bold tracking-wide">Select a historical regime from the sidebar to inspect its organizational department structure.</span>
          </div>
        )}
      </div>

    </div>
  );
};
export default OrgChart;
