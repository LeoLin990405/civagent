import React, { useState, useEffect } from 'react';
import { History, BookOpen, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface EpisodicMemory {
  id: number;
  regime: string;
  event_type: string;
  content: string;
  match_id: string;
  timestamp: string;
}

interface EpisodicMemoryExplorerProps {
  regime: string;
}

export const EpisodicMemoryExplorer: React.FC<EpisodicMemoryExplorerProps> = ({ regime }) => {
  const [memories, setMemories] = useState<EpisodicMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!regime) return;
    setLoading(true);
    fetch(`/api/history/${regime}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch history');
        return res.json();
      })
      .then((data) => {
        setMemories(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [regime]);

  if (!regime) return <div className="glass-panel text-[var(--accent-cyan)] p-6">Select a regime to view its episodic memory.</div>;

  return (
    <div className="glass-panel" style={{ height: 'calc(100vh - 12rem)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '1px solid rgba(0,255,255,0.1)', padding: '1.5rem', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <BookOpen size={24} style={{ color: 'var(--accent-cyan)' }} />
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-cyan)', margin: 0 }}>平行宇宙史书 (Episodic Memory Archive)</h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: '0.25rem 0 0 0' }}>
            Documenting the structural evolution and historical precedents of <span style={{ color: '#fff' }}>{regime}</span> across timelines.
          </p>
        </div>
      </div>

      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        
        {/* New Analytics Dashboard */}
        <AnalyticsDashboard selectedRegime={regime} />

        <h3 className="text-lg font-bold text-white/80 mt-10 mb-4 px-2">Historical Event Logs</h3>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-[var(--accent-cyan)] animate-pulse">Loading Chronicles...</span>
          </div>
        ) : error ? (
          <div className="glass-panel p-4 flex items-start gap-3" style={{ background: 'rgba(255, 51, 102, 0.1)', borderColor: 'rgba(255, 51, 102, 0.3)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--accent-crimson)', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ color: 'var(--accent-crimson)' }}>{error}</span>
          </div>
        ) : memories.length === 0 ? (
          <div className="glass-panel p-6 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
            No historical records found for this regime yet. Engage in tournaments to build its history.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {memories.map((mem) => {
              const scoreMatch = mem.content.match(/Score: (\d+(?:\.\d+)?)/);
              const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
              const isSuccess = score >= 7;
              
              return (
                <div key={mem.id} className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px',
                    background: isSuccess ? 'var(--accent-cyan)' : 'var(--accent-crimson)',
                    boxShadow: \`0 0 10px \${isSuccess ? 'var(--accent-cyan)' : 'var(--accent-crimson)'}\`
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isSuccess ? <ShieldCheck size={16} style={{ color: 'var(--accent-cyan)' }} /> : <AlertTriangle size={16} style={{ color: 'var(--accent-crimson)' }} />}
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isSuccess ? 'var(--accent-cyan)' : 'var(--accent-crimson)' }}>
                        {isSuccess ? 'Successful Precedent' : 'Historical Failure'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                      <Clock size={12} />
                      {new Date(mem.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.875rem', 
                    lineHeight: 1.6, 
                    color: 'rgba(255,255,255,0.8)',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '1rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {mem.content}
                  </div>
                  
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                    Match Ref: {mem.match_id}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
