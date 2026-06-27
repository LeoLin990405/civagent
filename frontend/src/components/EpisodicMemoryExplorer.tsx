import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface EpisodicMemory {
  id: number;
  regime: string;
  event_type: string;
  content: string;
  match_id: string;
  timestamp: string;
}

interface EpisodicMemoryExplorerProps {
  regime?: string;
}

export const EpisodicMemoryExplorer: React.FC<EpisodicMemoryExplorerProps> = ({ regime = 'china/tang' }) => {
  const [memories, setMemories] = useState<EpisodicMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!regime) return;
    setLoading(true);
    fetch(`/api/history/${encodeURIComponent(regime)}`)
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

  if (!regime) return <div className="glass-panel" style={{ padding: '24px', color: 'var(--accent-blue)', textAlign: 'center' }}>Select a regime to view its episodic memory.</div>;

  return (
    <div className="glass-panel" style={{ height: 'calc(100vh - 12rem)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '1px solid var(--border-light)', padding: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <BookOpen size={24} style={{ color: 'var(--accent-blue)' }} />
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>平行宇宙史书 (Episodic Memory Archive)</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Documenting the structural evolution and historical precedents of <span style={{ color: 'var(--accent-emerald)' }}>{regime}</span> across timelines.
          </p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>Historical Event Logs</h3>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--accent-blue)', animation: 'pulse 1.5s infinite' }}>
            <span>Loading Chronicles...</span>
          </div>
        ) : error ? (
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--accent-crimson)', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ color: 'var(--accent-crimson)' }}>{error}</span>
          </div>
        ) : memories.length === 0 ? (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No historical records found for this regime yet. Engage in tournaments to build its history.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {memories.map((mem) => {
              const scoreMatch = mem.content.match(/Score: (\d+(?:\.\d+)?)/);
              const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
              const isSuccess = score >= 7;
              
              return (
                <div key={mem.id} className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px',
                    background: isSuccess ? 'var(--accent-emerald)' : 'var(--accent-crimson)',
                    boxShadow: `0 0 10px ${isSuccess ? 'var(--accent-emerald)' : 'var(--accent-crimson)'}`
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isSuccess ? <ShieldCheck size={16} style={{ color: 'var(--accent-emerald)' }} /> : <AlertTriangle size={16} style={{ color: 'var(--accent-crimson)' }} />}
                      <span style={{ fontSize: '14px', fontWeight: 600, color: isSuccess ? 'var(--accent-emerald)' : 'var(--accent-crimson)' }}>
                        {isSuccess ? 'Successful Precedent' : 'Historical Failure'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <Clock size={12} />
                      {new Date(mem.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '16px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    color: 'var(--text-main)',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto',
                    border: '1px solid var(--border-light)'
                  }}>
                    {mem.content}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span><span style={{ opacity: 0.6 }}>Match ID:</span> {mem.match_id.slice(0, 8)}...</span>
                    <span><span style={{ opacity: 0.6 }}>Type:</span> {mem.event_type}</span>
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
