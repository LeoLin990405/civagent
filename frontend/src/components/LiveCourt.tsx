import React, { useEffect, useState, useRef } from 'react';
import { Radio, Users, Activity, ShieldAlert, AlertTriangle } from 'lucide-react';
import { splitActor } from '../utils/actorName';

interface MatchMeta {
  id: string;
  format: string;
  mtime: number;
  meta: { regime?: string; [key: string]: unknown };
}

interface EventPayload {
  type: string;
  text?: string;
  target?: string;
  reason?: string;
  ts?: number;
  actor?: string;
}

interface LiveCourtProps {
  initialMatchId?: string;
}

export const LiveCourt: React.FC<LiveCourtProps> = ({ initialMatchId }) => {
  const [matches, setMatches] = useState<MatchMeta[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(initialMatchId ?? null);
  const [events, setEvents] = useState<EventPayload[]>([]);
  const [connected, setConnected] = useState(false);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  // Fetch recent matches
  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        setMatches(data);
        if (data.length > 0 && !selectedMatch) {
          setSelectedMatch(data[0].id);
        }
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Connect to SSE stream when a match is selected
  useEffect(() => {
    if (!selectedMatch) return;
    
    setEvents([]);
    setConnected(false);
    
    const es = new EventSource(`/api/matches/${selectedMatch}/stream`);
    
    es.onopen = () => setConnected(true);
    
    es.onmessage = (e) => {
      try {
        const newEvents: EventPayload[] = JSON.parse(e.data);
        setEvents(prev => [...prev, ...newEvents]);
      } catch (err) {
        console.error('SSE parse error', err);
      }
    };
    
    es.onerror = () => {
      console.error('SSE error or closed');
      es.close();
      setConnected(false);
    };

    return () => {
      es.close();
    };
  }, [selectedMatch]);

  // Auto-scroll to bottom
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const renderEvent = (ev: EventPayload, idx: number) => {
    if (ev.type === 'turn' && ev.text) {
      const { regime: actorRegime, office: actorOffice } = splitActor(ev.actor);
      const actorLabel = actorOffice || actorRegime || 'agent';
      return (
        <div key={idx} className="glass-card" style={{ padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Users size={16} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>AGENT RESPONSE</span>
            <span className={`role-badge ${actorOffice ? 'office-badge' : ''}`} data-testid="live-actor-role">
              {actorLabel}
            </span>
            {actorOffice && actorRegime && (
              <span className="actor-regime-context" data-testid="live-actor-regime">
                {actorRegime}
              </span>
            )}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
            color: 'var(--text-main)'
          }}>
            {ev.text.trim()}
          </div>
        </div>
      );
    }
    
    if (ev.type === 'veto_triggered') {
      return (
        <div key={idx} className="veto-badge" style={{ padding: '16px', borderRadius: '12px', marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <ShieldAlert size={24} style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>CENSORATE VETO TRIGGERED</h4>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>{ev.reason || 'The policy was rejected on moral or procedural grounds.'}</p>
          </div>
        </div>
      );
    }

    if (ev.type === 'impeach_triggered') {
      return (
        <div key={idx} className="glass-card" style={{ padding: '16px', marginBottom: '12px', background: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--border-glow-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle size={24} style={{ flexShrink: 0, color: 'var(--accent-gold)' }} />
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>IMPEACHMENT FILED</h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Target: <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{ev.target}</span></p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{ev.reason}</p>
            </div>
          </div>
        </div>
      );
    }

    if (ev.type === 'edict_triggered') {
      return (
        <div key={idx} className="glass-card" style={{ padding: '16px', marginBottom: '12px', background: 'rgba(139, 92, 246, 0.1)', borderColor: 'var(--border-glow-purple)', boxShadow: 'var(--shadow-glow-purple)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={24} style={{ flexShrink: 0, color: 'var(--accent-purple)' }} />
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-purple)' }}>IMPERIAL EDICT</h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{ev.reason || 'Absolute authority exercised.'}</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="glass-panel" style={{ height: 'calc(100vh - 12rem)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-light)', padding: '24px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Radio size={24} style={{ color: connected ? 'var(--accent-emerald)' : 'var(--accent-crimson)', animation: connected ? 'pulse 2s infinite' : 'none' }} />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Live Imperial Court</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Real-time monitoring of agent debates and constitutional mechanism triggers.
            </p>
          </div>
        </div>

        <div>
          <select 
            value={selectedMatch || ''} 
            onChange={e => setSelectedMatch(e.target.value)}
            style={{ 
              background: 'var(--bg-dark)', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border-light)', 
              padding: '8px 12px', 
              borderRadius: '8px',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px'
            }}
          >
            {matches.map(m => (
              <option key={m.id} value={m.id}>{m.id} ({m.meta?.regime || 'legacy'})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stream Window */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
        {events.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', opacity: 0.5 }}>
            <Activity size={48} style={{ marginBottom: '16px' }} />
            <p>Awaiting transmissions from the Imperial Court...</p>
          </div>
        ) : (
          events.map((ev, idx) => renderEvent(ev, idx))
        )}
        <div ref={eventsEndRef} />
      </div>
      
    </div>
  );
};
