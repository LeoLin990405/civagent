import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { EpisodicMemoryExplorer } from './components/EpisodicMemoryExplorer';
import { LiveCourt } from './components/LiveCourt';
import { MatchArchive } from './components/MatchArchive';
import { RegimeBrowserV6 } from './components/RegimeBrowserV6';
import RankingsPanel from './components/RankingsPanel';
import { PlayCircle, AlertCircle, RefreshCw } from 'lucide-react';
import type { RegimeDetail } from './types/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [regimes, setRegimes] = useState<RegimeDetail[]>([]);

  const fetchRegimes = async () => {
    try {
      const res = await fetch('/api/regimes');
      if (res.ok) {
        const data = await res.json();
        setRegimes(data);
      }
    } catch (e) {
      console.warn("Failed to fetch regimes, using fallback.", e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/regimes')
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then((data) => { if (!cancelled) setRegimes(data); })
      .catch((e) => { if (!cancelled) console.warn("Failed to fetch regimes, using fallback.", e); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        <header style={{ padding: '24px 40px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 5 }}>
          <h1 className="text-gradient" style={{ margin: 0, fontSize: '24px' }}>
            {activeTab === 'overview' && 'Empire Overview'}
            {activeTab === 'regimes' && 'Regime Browser'}
            {activeTab === 'analytics' && 'Analytics Dashboard'}
            {activeTab === 'memory' && 'Episodic Memory'}
            {activeTab === 'veto' && 'Constitution Monitor'}
            {activeTab === 'archive' && 'Match Archive'}
            {activeTab === 'live' && 'Live Court'}
            {activeTab === 'rankings' && 'Cross-Tournament Rankings'}
          </h1>
        </header>

        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }} className="animate-fade-in">
          {activeTab === 'overview' && (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="flex-center" style={{ flexDirection: 'column', gap: '20px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlayCircle size={40} className="text-gradient" />
                </div>
                <h2 style={{ fontSize: '28px', margin: 0 }}>CivAgent V6 Core Online</h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                  Multi-agent orchestration powered by historical topologies. The system is actively monitoring {regimes.length} historical regimes. 
                  Navigate through the sidebar to explore analytics, memory streams, and real-time mechanism triggers.
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                  <button className="btn btn-primary" onClick={() => setActiveTab('analytics')}>
                    View Analytics
                  </button>
                  <button className="btn btn-ghost" onClick={() => fetchRegimes()}>
                    <RefreshCw size={16} /> Sync Regimes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'regimes' && (
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <RegimeBrowserV6 />
            </div>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard />
          )}

          {activeTab === 'memory' && (
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <EpisodicMemoryExplorer />
            </div>
          )}

          {activeTab === 'veto' && (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="flex-center" style={{ flexDirection: 'column', gap: '20px' }}>
                <div className="veto-badge" style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={40} />
                </div>
                <h2 style={{ fontSize: '28px', margin: 0 }}>Veto Monitor</h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                  Awaiting hardcoded veto intercepts. Any auditing agent issuing a [VETO] command will trigger a system-level process termination.
                </p>
                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent-emerald)', marginTop: '20px', width: '100%', maxWidth: '600px', textAlign: 'left' }}>
                  $ Listening on constitutional boundaries...
                </div>
              </div>
            </div>
          )}

          {activeTab === 'archive' && (
            <MatchArchive />
          )}

          {activeTab === 'live' && (
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <LiveCourt />
            </div>
          )}

          {activeTab === 'rankings' && (
            <RankingsPanel />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
