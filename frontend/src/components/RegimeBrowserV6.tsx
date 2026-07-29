import React, { useState, useEffect } from 'react';
import { Shield, Scroll, Crown, Search, ChevronRight, Globe, MapPin } from 'lucide-react';

interface RegimeMeta {
  id: string;
  metadata: {
    id: string;
    name: { zh: string; en: string };
    era: { zh: string; en: string };
    system: { zh: string; en: string };
    description: { zh: string; en: string };
    agentCount: number;
    tags: string[];
    orchestrationPattern: string;
    mechanisms?: string[];
  };
  identity: string;
  soul: string;
}

const mechanismIcons: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  VETO: { icon: <Shield size={14} />, color: '#ef4444', label: 'VETO' },
  IMPEACH: { icon: <Scroll size={14} />, color: '#f59e0b', label: 'IMPEACH' },
  EDICT: { icon: <Crown size={14} />, color: '#8b5cf6', label: 'EDICT' },
};

export const RegimeBrowserV6: React.FC = () => {
  const [regimes, setRegimes] = useState<RegimeMeta[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState<string>('all');

  useEffect(() => {
    fetch('/api/regimes')
      .then(r => r.json())
      .then(setRegimes)
      .catch(console.warn);
  }, []);

  const filtered = regimes.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      r.metadata.name.zh.includes(q) ||
      r.metadata.name.en.toLowerCase().includes(q) ||
      r.metadata.id.includes(q);
    const matchesRegion = filterRegion === 'all' ||
      (filterRegion === 'china' && r.id.startsWith('china/')) ||
      (filterRegion === 'global' && r.id.startsWith('global/'));
    return matchesSearch && matchesRegion;
  });

  const selected = regimes.find(r => r.id === selectedId);

  const chinaCount = regimes.filter(r => r.id.startsWith('china/')).length;
  const globalCount = regimes.filter(r => r.id.startsWith('global/')).length;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: '0' }}>
      {/* Left: List */}
      <div style={{ width: '380px', minWidth: '380px', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
        {/* Stats */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '12px' }}>
          <div className="glass-card" style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-crimson)' }}>{chinaCount}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Chinese Dynasties</div>
          </div>
          <div className="glass-card" style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-blue)' }}>{globalCount}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Global Empires</div>
          </div>
          <div className="glass-card" style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-emerald)' }}>{regimes.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search regimes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 8px 8px 30px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-main)',
                fontSize: '13px', outline: 'none', fontFamily: 'inherit'
              }}
            />
          </div>
          <select
            value={filterRegion}
            onChange={e => setFilterRegion(e.target.value)}
            style={{
              padding: '8px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-main)',
              fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer'
            }}
          >
            <option value="all">All</option>
            <option value="china">China</option>
            <option value="global">Global</option>
          </select>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.map(r => (
            <div
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              style={{
                padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                borderBottom: '1px solid var(--border-subtle)',
                background: selectedId === r.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderLeft: selectedId === r.id ? '3px solid var(--accent-blue)' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{r.metadata.name.zh}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.metadata.name.en}</div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(r.metadata.mechanisms || []).map(m => (
                  <span key={m} style={{
                    display: 'inline-flex', alignItems: 'center', padding: '2px 6px',
                    borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                    background: `${mechanismIcons[m]?.color}22`,
                    color: mechanismIcons[m]?.color,
                  }}>
                    {mechanismIcons[m]?.icon}
                  </span>
                ))}
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-dark)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {selected ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Globe size={24} style={{ color: 'var(--accent-blue)' }} />
              <div>
                <h2 style={{ margin: 0, fontSize: '22px' }}>{selected.metadata.name.zh} / {selected.metadata.name.en}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={12} /> {selected.metadata.era.zh}
                </div>
              </div>
            </div>

            {/* Mechanism Badges */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {(selected.metadata.mechanisms || []).map(m => (
                <span key={m} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
                  borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  background: `${mechanismIcons[m]?.color}15`,
                  border: `1px solid ${mechanismIcons[m]?.color}40`,
                  color: mechanismIcons[m]?.color,
                }}>
                  {mechanismIcons[m]?.icon} {mechanismIcons[m]?.label}
                </span>
              ))}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
                borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
                color: 'var(--accent-cyan)',
              }}>
                {selected.metadata.orchestrationPattern}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
                borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                color: 'var(--accent-emerald)',
              }}>
                {selected.metadata.agentCount} agents
              </span>
            </div>

            {/* System */}
            <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                System
              </h4>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>{selected.metadata.system.zh}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{selected.metadata.system.en}</div>
            </div>

            {/* Description */}
            <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Description
              </h4>
              <p style={{ margin: 0, lineHeight: 1.7 }}>{selected.metadata.description.zh}</p>
              <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.7 }}>{selected.metadata.description.en}</p>
            </div>

            {/* IDENTITY Preview */}
            {selected.identity && (
              <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  IDENTITY.md
                </h4>
                <pre style={{
                  margin: 0, padding: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px',
                  fontSize: '12px', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  color: 'var(--text-muted)', maxHeight: '400px', overflowY: 'auto',
                }}>
                  {selected.identity}
                </pre>
              </div>
            )}

            {/* SOUL Preview */}
            {selected.soul && (
              <div className="glass-card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--accent-crimson)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  SOUL.md
                </h4>
                <pre style={{
                  margin: 0, padding: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px',
                  fontSize: '12px', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  color: 'var(--text-muted)', maxHeight: '300px', overflowY: 'auto',
                }}>
                  {selected.soul}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <Globe size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <div style={{ fontSize: '16px' }}>Select a regime to view details</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Browse {regimes.length} historical governance systems</div>
          </div>
        )}
      </div>
    </div>
  );
};
