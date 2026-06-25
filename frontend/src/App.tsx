import React, { useEffect, useState } from 'react';
import { Zap, History, BookOpen, Play, Cpu, Layers, RefreshCw, AlertCircle, PlayCircle } from 'lucide-react';
import type { RegimeDetail, MatchSummary, MatchEvent } from './types/api';
import TerminalPanel from './components/TerminalPanel';
import JudgeLeaderboard from './components/JudgeLeaderboard';
import CodexBrowser from './components/CodexBrowser';
import RegimeBrowser from './components/RegimeBrowser';
import { EpisodicMemoryExplorer } from './components/EpisodicMemoryExplorer';

// Removed mock data for clean production usage

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'codex' | 'regimes'>('live');
  const [selectedHistoryRegime, setSelectedHistoryRegime] = useState<string>('china/tang');
  const [regimes, setRegimes] = useState<RegimeDetail[]>([]);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchSummary | null>(null);
  const [selectedMatchEvents, setSelectedMatchEvents] = useState<MatchEvent[]>([]);

  // Real Tournament states
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [activeTournament, setActiveTournament] = useState<any | null>(null);
  const [realMatchEvents, setRealMatchEvents] = useState<{ [matchId: string]: MatchEvent[] }>({});
  const [realMatchMetas, setRealMatchMetas] = useState<{ [matchId: string]: any }>({});
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Live simulation states for Demo mode
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<'running' | 'completed' | 'idle'>('idle');
  const [simulationEvents, setSimulationEvents] = useState<{ [regime: string]: MatchEvent[] }>({
    'china/tang': [],
    'global/roman-republic': [],
    'global/soviet': [],
    'global/prussia': [],
  });

  // Fetch real data on load
  useEffect(() => {
    fetchRegimes();
    fetchMatches();
    fetchTournaments(true);
  }, []);

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

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (e) {
      console.warn("Failed to fetch matches.", e);
    }
  };

  const fetchTournaments = async (selectLatest = false) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch('/api/tournaments');
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
        
        if (data.length > 0) {
          // Sort to find the latest
          const sorted = [...data].sort((a, b) => b.manifest.createdAt - a.manifest.createdAt);
          if (selectLatest || !activeTournament) {
            setActiveTournament(sorted[0]);
            setIsDemoMode(false); // Default to real if found
          } else {
            // Sync current active tournament if it exists
            const currentSync = data.find((t: any) => t.id === activeTournament.id);
            if (currentSync) {
              setActiveTournament(currentSync);
            }
          }
        } else {
          // No tournaments in ~/.civagent. Activate Demo fallback!
          setIsDemoMode(true);
        }
      } else {
        setApiError("Failed to fetch tournaments from the server middleware.");
        setIsDemoMode(true);
      }
    } catch (e: any) {
      console.error("Failed to load tournaments:", e);
      setApiError("Local API server offline or inaccessible.");
      setIsDemoMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRealTournamentEvents = async () => {
    if (!activeTournament || isDemoMode) return;
    const civs = activeTournament.manifest.civs || [];
    
    // Fetch each civ's match details in parallel
    const promises = civs.map(async (civ: any) => {
      try {
        const res = await fetch(`/api/matches/${civ.matchId}`);
        if (res.ok) {
          const matchData = await res.json();
          return { matchId: civ.matchId, events: matchData.events || [], meta: matchData.meta };
        }
      } catch (e) {
        console.error(`Failed to fetch events for match ${civ.matchId}:`, e);
      }
      return null;
    });

    const results = await Promise.all(promises);
    const updatedEvents: { [matchId: string]: MatchEvent[] } = {};
    const updatedMetas: { [matchId: string]: any } = {};
    results.forEach(res => {
      if (res) {
        updatedEvents[res.matchId] = res.events;
        updatedMetas[res.matchId] = res.meta;
      }
    });

    setRealMatchEvents(prev => ({
      ...prev,
      ...updatedEvents
    }));
    setRealMatchMetas(prev => ({
      ...prev,
      ...updatedMetas
    }));
  };

  // Real data SSE & polling hook
  useEffect(() => {
    if (isDemoMode || !activeTournament) return;

    fetchRealTournamentEvents();

    // Check if any match in selected tournament is still running
    const hasRunning = activeTournament.manifest.civs.some((civ: any) => civ.exitCode === null);
    
    const eventSources: EventSource[] = [];

    if (hasRunning) {
      // Subscribe to SSE for logs
      activeTournament.manifest.civs.forEach((civ: any) => {
        if (civ.exitCode !== null) return; // skip finished
        const es = new EventSource(`/api/matches/${civ.matchId}/stream`);
        es.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            if (Array.isArray(parsed)) {
              setRealMatchEvents(prev => {
                const current = prev[civ.matchId] || [];
                const combined = [...current, ...parsed];
                // Deduplicate by seq
                const seen = new Set();
                const deduplicated = combined.filter(ev => {
                  if (ev.seq != null) {
                    if (seen.has(ev.seq)) return false;
                    seen.add(ev.seq);
                  }
                  return true;
                });
                deduplicated.sort((a, b) => (a.seq || 0) - (b.seq || 0));
                return { ...prev, [civ.matchId]: deduplicated };
              });
            }
          } catch (err) {}
        };
        eventSources.push(es);
      });
    }

    // Still poll tournaments slowly to detect when tournament finishes (exitCode updates)
    const interval = setInterval(() => {
      if (hasRunning) {
        fetchTournaments(false);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      eventSources.forEach(es => es.close());
    };
  }, [activeTournament, isDemoMode]);

  const fetchMatchDetails = async (matchId: string) => {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedMatchEvents(data.events || []);
      }
    } catch (e) {
      console.error("Failed to load match details:", e);
    }
  };

  // Launch a mock simulation in the UI
  const handleStartSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStatus('running');
    
    // Clear previous simulation events
    setSimulationEvents({
      'china/tang': [],
      'global/roman-republic': [],
      'global/soviet': [],
      'global/prussia': [],
    });

    const startTime = Date.now();

    // Map each log delay to an interval timer
    Object.keys(SIMULATION_LOGS).forEach((regime) => {
      const logs = SIMULATION_LOGS[regime];
      
      logs.forEach((log, index) => {
        setTimeout(() => {
          setSimulationEvents(prev => {
            const current = prev[regime] || [];
            
            // Append a match start event on very first item
            const prefix = index === 0 
              ? [{ matchId: 'mock-sim', ts: startTime, seq: 0, type: 'match_start' as const, text: 'MATCH INITIATED: ' + MOCK_PROMPT }] 
              : [];

            const newEvent: MatchEvent = {
              matchId: 'mock-sim',
              ts: startTime + log.delay,
              seq: index + 1,
              type: 'turn',
              actor: log.actor,
              text: log.text,
            };

            return {
              ...prev,
              [regime]: [...current, ...prefix, newEvent]
            };
          });
        }, log.delay);
      });

      // Append sediment completed at the end of logs stream
      const totalDelay = logs[logs.length - 1].delay + 1000;
      setTimeout(() => {
        setSimulationEvents(prev => {
          const current = prev[regime] || [];
          const endEvent: MatchEvent = {
            matchId: 'mock-sim',
            ts: startTime + totalDelay,
            seq: logs.length + 2,
            type: 'skill',
            text: 'Nous Hermes skill extracted: learned-seasonal-frontier-risk-planning.md saved.',
          };
          return {
            ...prev,
            [regime]: [...current, endEvent]
          };
        });
      }, totalDelay);
    });

    // Complete the entire simulation
    setTimeout(() => {
      setSimulationStatus('completed');
      setIsSimulating(false);

      // Append this mock match to the matches history list so the user can interact with it!
    }, 12500);
  };

  return (
    <div className="flex min-h-screen">
      
      {/* LEFT SIDEBAR NAVBAR */}
      <aside className="w-64 bg-[var(--bg-surface-raised)] border-r border-[var(--border-subtle)] flex flex-col p-5 shrink-0 relative z-10 shadow-[var(--shadow-ambient)]">
        
        {/* Branding Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[rgba(0,240,255,0.05)] border border-[var(--border-glow-cyan)] text-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)] backdrop-blur-sm">
            <Cpu size={20} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">CivAgent</h1>
            <span className="text-[10px] font-mono text-[var(--accent-gold)] uppercase tracking-wider drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">v5.0.2 (NEXUS)</span>
          </div>
        </div>

        {/* Tab Links */}
        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`w-full action-btn justify-start gap-3 px-4 py-3 ${activeTab === 'live' ? 'active' : ''}`}
          >
            <Zap size={15} /> Live Monitor
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full action-btn justify-start gap-3 px-4 py-3 ${activeTab === 'history' ? 'active text-[var(--accent-purple)] border-[var(--border-glow-purple)] shadow-[var(--shadow-glow-purple)] bg-[rgba(189,0,255,0.1)]' : ''}`}
          >
            <History size={15} /> Match Archive
          </button>

          <button
            onClick={() => setActiveTab('codex')}
            className={`w-full action-btn justify-start gap-3 px-4 py-3 ${activeTab === 'codex' ? 'active text-[var(--accent-green)] border-[var(--border-glow-green)] shadow-[0_0_20px_rgba(5,255,161,0.15)] bg-[rgba(5,255,161,0.1)]' : ''}`}
          >
            <BookOpen size={15} /> Regimes Codex
          </button>

          <button
            onClick={() => setActiveTab('regimes')}
            className={`w-full action-btn justify-start gap-3 px-4 py-3 ${activeTab === 'regimes' ? 'active text-[var(--accent-gold)] border-[var(--border-glow-gold)] shadow-[var(--shadow-glow-gold)] bg-[rgba(255,215,0,0.1)]' : ''}`}
          >
            <Layers size={15} /> Regimes Browser
          </button>
        </nav>

        {/* Footer info */}
        <div className="pt-4 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] font-mono shrink-0">
          <span>Neural Engine Active</span>
          <span className="block mt-1 text-[var(--accent-green)] drop-shadow-[0_0_3px_rgba(5,255,161,0.5)]">System: NOMINAL</span>
        </div>

      </aside>

      {/* MAIN CONTAINER WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg-surface)] relative">
        
        {/* Top Header */}
        <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-glass-heavy)] backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">Workspace</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_8px_var(--accent-cyan)]"></span>
            <span className="text-xs font-mono text-[var(--text-secondary)]">civagent-core-simulation</span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-4">
            
            {/* API Status */}
            {apiError && !isDemoMode && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--accent-crimson)] font-mono drop-shadow-[0_0_5px_var(--accent-crimson)]" title={apiError}>
                <AlertCircle size={12} /> Link Offline
              </span>
            )}

            {/* Mode Indicator & Selector */}
            <div className="flex bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] p-1 rounded-lg text-[10px] font-semibold">
              <button
                onClick={() => {
                  if (tournaments.length === 0) {
                    alert("No real tournaments found in ~/.civagent. Run a CLI tournament first or stay in Demo mode.");
                    return;
                  }
                  setIsDemoMode(false);
                }}
                className={`px-4 py-1.5 rounded transition-all uppercase tracking-widest ${
                  !isDemoMode 
                    ? 'bg-[var(--accent-cyan)] text-black font-bold shadow-[var(--shadow-glow-cyan)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Live Monitor
              </button>
              <button
                onClick={() => setIsDemoMode(true)}
                className={`px-4 py-1.5 rounded transition-all uppercase tracking-widest ${
                  isDemoMode 
                    ? 'bg-[var(--accent-gold)] text-black font-bold shadow-[var(--shadow-glow-gold)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Simulated Sandbox
              </button>
            </div>

            <button
              onClick={() => fetchTournaments(true)}
              className="action-btn w-8 h-8 rounded-full flex items-center justify-center p-0"
              title="Refresh local tournament manifests"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>

          </div>
        </header>

        {/* Tab Contents Workspace */}
        <div className="flex-1 overflow-y-auto p-6 z-0">
          
          {/* TAB 1: LIVE TOURNAMENT MONITOR */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              
              {isDemoMode ? (
                /* ---------------- DEMO MODE VIEW ---------------- */
                <div className="space-y-8">
                  {/* Task/Prompt Overview Card */}
                  <div className="glass-panel glass-panel-gold p-6 flex flex-col md:flex-row items-center justify-between gap-5 relative">
                    <div className="space-y-3 max-w-[70%]">
                      <div className="flex items-center gap-2 text-[10px] text-[var(--accent-gold)] font-mono uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">
                        <PlayCircle size={14} className="animate-pulse" />
                        <span>SIMULATED SANDBOX MONITOR ACTIVE</span>
                      </div>
                      <h2 className="text-base font-medium">
                        Crisis Task: <span className="font-mono text-[var(--accent-gold)] opacity-90">"{MOCK_PROMPT}"</span>
                      </h2>
                    </div>

                    <div className="shrink-0 flex gap-3">
                      <button
                        onClick={handleStartSimulation}
                        disabled={simulationStatus === 'running'}
                        className={`action-btn px-6 py-3 font-bold uppercase tracking-wider ${
                          simulationStatus === 'running'
                            ? 'opacity-50 cursor-not-allowed'
                            : 'bg-[var(--accent-gold)] text-black border-[var(--accent-gold)] hover:bg-[#ffe233] shadow-[var(--shadow-glow-gold)]'
                        }`}
                        style={{ color: simulationStatus === 'running' ? '' : 'black' }}
                      >
                        <Play size={16} className="mr-2" /> 
                        {simulationStatus === 'running' ? 'Simulating...' : 'Execute Protocol'}
                      </button>
                    </div>
                  </div>

                  {/* Parallel terminals grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {SIMULATION_CIVS.map((civ) => {
                      const evs = simulationEvents[civ.id] || [];
                      const civStatus = 
                        simulationStatus === 'idle' ? 'idle' :
                        simulationStatus === 'running' && evs.length === 0 ? 'idle' :
                        simulationStatus === 'running' ? 'running' : 'completed';

                      return (
                        <TerminalPanel
                          key={civ.id}
                          regimeId={civ.id}
                          displayName={civ.name}
                          backend={civ.backend}
                          events={evs}
                          status={civStatus}
                          sediment={civStatus === 'completed' ? 'success' : undefined}
                        />
                      );
                    })}
                  </div>

                  {/* Tournament scoreboard/Leaderboard (renders when completed) */}
                  {simulationStatus === 'completed' && (
                    <div className="animate-fade-in">
                      <JudgeLeaderboard
                        scores={MOCK_JUDGE_SCORES}
                        verdicts={MOCK_JUDGE_VERDICTS}
                        civNames={{
                          'china/tang': 'Tang Dynasty',
                          'global/roman-republic': 'Roman Republic',
                          'global/soviet': 'Soviet Union',
                          'global/prussia': 'Kingdom of Prussia',
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* ---------------- REAL GOVERNANCE TOURNAMENT MONITOR ---------------- */
                activeTournament ? (
                  <div className="space-y-8 animate-fade-in">
                    
                    {/* Real Tournament Info Card */}
                    <div className="glass-panel glass-panel-cyan p-6 flex flex-col md:flex-row items-center justify-between gap-5 relative">
                      <div className="space-y-3 max-w-[70%]">
                        <div className="flex items-center gap-2 text-[10px] text-[var(--accent-cyan)] font-mono uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
                          <Cpu size={14} className="animate-pulse" />
                          <span>REAL-TIME GOVERNANCE MONITOR ACTIVE</span>
                        </div>
                        <h2 className="text-base font-medium">
                          Active Prompt: <span className="font-mono text-[var(--accent-cyan)] opacity-90">"{activeTournament.manifest.task}"</span>
                        </h2>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                          TOURNAMENT ID: {activeTournament.id} · STARTED: {new Date(activeTournament.manifest.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Tournament List Selector Dropdown */}
                      <div className="shrink-0 flex items-center gap-3">
                        <span className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-widest">SELECT RUN:</span>
                        <select
                          value={activeTournament.id}
                          onChange={(e) => {
                            const found = tournaments.find(t => t.id === e.target.value);
                            if (found) setActiveTournament(found);
                          }}
                          className="bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] rounded-lg text-xs p-2 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--border-glow-cyan)] min-w-[180px] shadow-[var(--shadow-glass)] cursor-pointer"
                        >
                          {tournaments.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.id.substring(0, 16)}...
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Real Parallel Terminals Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {activeTournament.manifest.civs.map((civ: any) => {
                        const evs = realMatchEvents[civ.matchId] || [];
                        const civStatus = 
                          civ.exitCode === null ? 'running' :
                          civ.exitCode === 0 ? 'completed' : 'failed';

                        const parts = civ.regime.split('/');
                        const name = parts[parts.length - 1];
                        const displayName = name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

                        const matchMeta = realMatchMetas[civ.matchId];
                        const sediment = matchMeta ? matchMeta.sediment : undefined;

                        return (
                          <TerminalPanel
                            key={civ.matchId}
                            regimeId={civ.regime}
                            displayName={displayName}
                            backend={civ.backend}
                            events={evs}
                            status={civStatus}
                            sediment={sediment}
                          />
                        );
                      })}
                    </div>

                    {/* Real scoreboard/Leaderboard (renders when judge Result is loaded) */}
                    {(activeTournament.judgeResult || (activeTournament.manifest.judge && activeTournament.manifest.judge.scores && activeTournament.manifest.judge.scores.length > 0)) && (
                      <div className="animate-fade-in">
                        <JudgeLeaderboard
                          manifest={activeTournament.manifest}
                          judgeResult={activeTournament.judgeResult}
                        />
                      </div>
                    )}

                  </div>
                ) : (
                  /* ---------------- REAL MODE EMPTY STATE fallback ---------------- */
                  <div className="glass-panel p-12 text-center flex flex-col items-center justify-center gap-6 animate-fade-in min-h-[400px]">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(255,42,109,0.05)] border border-[var(--border-glow-purple)] text-[var(--accent-purple)] shadow-[var(--shadow-glow-purple)]">
                      <AlertCircle size={32} />
                    </div>
                    <div className="max-w-lg space-y-3">
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">No Active Tournaments Found</h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        No governance runs have been logged in <code className="font-mono text-[var(--accent-cyan)] bg-[var(--bg-glass-light)] px-1 py-0.5 rounded">~/.civagent/tournaments/</code> yet.
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-mono mt-4 p-4 bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] rounded-lg text-left">
                        <span className="block mb-2 text-[var(--accent-gold)]">// Launch a parallel tournament run using the CLI:</span>
                        node engine/v5/tournament.mjs --civs china/tang,global/roman-republic "Establish border defense policies"
                      </p>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => fetchTournaments(true)}
                        className="action-btn px-6 py-2.5 font-bold uppercase tracking-wider text-xs"
                      >
                        <RefreshCw size={14} className="mr-2" /> Scan Directory
                      </button>
                      <button
                        onClick={() => setIsDemoMode(true)}
                        className="action-btn px-6 py-2.5 font-bold uppercase tracking-wider text-xs bg-[rgba(255,215,0,0.1)] text-[var(--accent-gold)] border-[var(--border-glow-gold)] shadow-[var(--shadow-glow-gold)]"
                      >
                        <Play size={14} className="mr-2" /> Activate Sandbox Demo
                      </button>
                    </div>
                  </div>
                )
              )}

            </div>
          )}

          {/* TAB 2: HISTORICAL MATCHES EXPLORER */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
              <div className="glass-panel" style={{ width: '250px', padding: '1rem', overflowY: 'auto' }}>
                <h3 className="text-sm font-bold text-[var(--accent-cyan)] mb-4">Select Regime</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {regimes.map(r => (
                    <button 
                      key={r.id}
                      onClick={() => setSelectedHistoryRegime(r.id)}
                      style={{ 
                        padding: '0.75rem', 
                        textAlign: 'left',
                        background: selectedHistoryRegime === r.id ? 'rgba(0,255,255,0.15)' : 'rgba(0,0,0,0.2)',
                        border: selectedHistoryRegime === r.id ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: selectedHistoryRegime === r.id ? '#fff' : 'rgba(255,255,255,0.6)'
                      }}
                    >
                      {r.metadata.name || r.id}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <EpisodicMemoryExplorer regime={selectedHistoryRegime} />
              </div>
            </div>
          )}

          {/* TAB 3: REGIMES CODEX */}
          {activeTab === 'codex' && (
            <CodexBrowser regimes={regimes} />
          )}

          {/* TAB 4: REGIMES BROWSER */}
          {activeTab === 'regimes' && (
            <RegimeBrowser regimes={regimes} />
          )}

        </div>

      </main>

    </div>
  );
};
export default App;
