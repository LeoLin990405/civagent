import React, { useState, useEffect, useCallback } from 'react';
import { Clock, ShieldAlert } from 'lucide-react';
import type { RegimeMetadata, SkillsStatsResponse, StagedSkillEntry } from '../types/api';

// A lightweight view of the summary endpoint
interface RegimeSummary {
  id: string;
  metadata: RegimeMetadata;
}

// Build a Set of filenames that belong to any duplicateGroup for quick lookup
function buildDuplicateSet(groups: string[][]): Set<string> {
  const s = new Set<string>();
  for (const group of groups) {
    for (const fn of group) s.add(fn);
  }
  return s;
}

export const SkillLibrary: React.FC = () => {
  const [regimes, setRegimes] = useState<RegimeSummary[]>([]);
  const [regimesLoading, setRegimesLoading] = useState(true);
  const [regimesError, setRegimesError] = useState<string | null>(null);

  const [selectedRegimeId, setSelectedRegimeId] = useState<string | null>(null);
  const [stats, setStats] = useState<SkillsStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Staging state
  const [staged, setStaged] = useState<StagedSkillEntry[]>([]);
  const [stagedLoading, setStagedLoading] = useState(false);
  const [stagedError, setStagedError] = useState<string | null>(null);

  // Load regime list on mount
  useEffect(() => {
    let cancelled = false;
    fetch('/api/regimes?summary=1')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load regimes: ${r.status}`);
        return r.json() as Promise<RegimeSummary[]>;
      })
      .then((data) => { if (!cancelled) setRegimes(data); })
      .catch((e) => { if (!cancelled) setRegimesError(e instanceof Error ? e.message : 'Failed to load regimes'); })
      .finally(() => { if (!cancelled) setRegimesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Fetch skill stats when a regime is selected
  const handleSelectRegime = useCallback((regimeId: string) => {
    setSelectedRegimeId(regimeId);
    setStats(null);
    setStatsError(null);
    setStatsLoading(true);
    setStaged([]);
    setStagedError(null);
    setStagedLoading(true);

    // Parse "region/id" from the regime id (e.g. "china/tang")
    const parts = regimeId.split('/');
    if (parts.length < 2) {
      setStatsError('Invalid regime id format');
      setStatsLoading(false);
      setStagedLoading(false);
      return;
    }
    const [region, id] = parts;

    fetch(`/api/skills/${encodeURIComponent(region)}/${encodeURIComponent(id)}/stats`)
      .then((r) => {
        if (r.status === 404) throw new Error('Regime not found on server');
        if (r.status === 400) throw new Error('Invalid regime id');
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json() as Promise<SkillsStatsResponse>;
      })
      .then((data) => { setStats(data); })
      .catch((e) => { setStatsError(e instanceof Error ? e.message : 'Failed to load skills'); })
      .finally(() => { setStatsLoading(false); });

    // Fetch staged skills (endpoint may not exist yet)
    fetch(`/api/skills/${encodeURIComponent(region)}/${encodeURIComponent(id)}/staged`)
      .then((r) => {
        if (r.status === 404) {
          // Endpoint not implemented yet — not an error
          setStaged([]);
          return null;
        }
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json() as Promise<{ staged: StagedSkillEntry[] }>;
      })
      .then((data) => { if (data) setStaged(data.staged ?? []); })
      .catch(() => { setStagedError('Staging endpoint not available'); })
      .finally(() => { setStagedLoading(false); });
  }, []);

  // Group regimes by region
  const chinaRegimes = regimes.filter((r) => r.metadata?.region === 'china');
  const globalRegimes = regimes.filter((r) => r.metadata?.region === 'global');

  const duplicateSet = stats ? buildDuplicateSet(stats.duplicateGroups) : new Set<string>();

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatTime = (epochMs: number): string => {
    if (!epochMs) return '—';
    return new Date(epochMs).toLocaleString();
  };

  const displayName = (r: RegimeSummary): string => {
    const n = r.metadata?.name;
    if (typeof n === 'object') return n.en;
    return n ?? r.id;
  };

  // ── Left panel: regime list ────────────────────────────────────────────────
  const renderRegimeList = () => {
    if (regimesLoading) {
      return <p style={{ color: 'var(--text-muted)', padding: '16px' }}>Loading regimes...</p>;
    }
    if (regimesError) {
      return <p style={{ color: 'var(--accent-crimson)', padding: '16px' }}>Error: {regimesError}</p>;
    }

    const renderGroup = (title: string, list: RegimeSummary[]) => {
      if (list.length === 0) return null;
      return (
        <div key={title} style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 12px' }}>
            {title} ({list.length})
          </div>
          {list.map((r) => {
            const isSelected = selectedRegimeId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleSelectRegime(r.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                {displayName(r)}
              </button>
            );
          })}
        </div>
      );
    };

    return (
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {renderGroup('China', chinaRegimes)}
        {renderGroup('Global', globalRegimes)}
      </div>
    );
  };

  // ── Staging section ───────────────────────────────────────────────────────
  const renderStagingSection = () => {
    if (stagedLoading) {
      return (
        <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Loading staged skills...
        </div>
      );
    }
    if (stagedError) {
      return (
        <div
          data-testid="staged-unavailable"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-muted)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldAlert size={14} />
          <span>Pending approval view unavailable — staging endpoint not yet implemented. Use <code>civagent skills pending</code> CLI.</span>
        </div>
      );
    }
    if (staged.length === 0) {
      return (
        <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px', opacity: 0.7 }}>
          No skills pending approval.
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Pending Approval ({staged.length})
        </div>
        {staged.map((skill) => (
          <div
            key={skill.filename}
            data-testid="staged-skill"
            className="glass-panel"
            style={{
              padding: '16px',
              border: '1px solid rgba(234, 179, 8, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Clock size={14} style={{ color: 'var(--accent-gold)' }} />
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{skill.name || skill.filename}</span>
                </div>
                {skill.description && (
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {skill.description}
                  </p>
                )}
                {skill.flaggedRules.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    {skill.flaggedRules.map((rule) => (
                      <span
                        key={rule}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: 'var(--accent-crimson)',
                          fontSize: '11px',
                        }}
                      >
                        {rule}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span>File: {skill.filename}</span>
                  <span>Size: {formatBytes(skill.sizeBytes)}</span>
                  <span>Modified: {formatTime(skill.mtime)}</span>
                </div>
              </div>
              <button
                disabled
                title="Approval via UI not yet supported. Use CLI: civagent skills approve"
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-light)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-muted)',
                  cursor: 'not-allowed',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  opacity: 0.5,
                  whiteSpace: 'nowrap',
                }}
              >
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── Right panel: skill stats ───────────────────────────────────────────────
  const renderSkillDetails = () => {
    if (!selectedRegimeId) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          <p>Select a regime to view its skills</p>
        </div>
      );
    }

    if (statsLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          <p>Loading skills...</p>
        </div>
      );
    }

    if (statsError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--accent-crimson)' }}>
          <p>Error: {statsError}</p>
        </div>
      );
    }

    if (!stats) return null;

    // Empty state (regime exists but has no skills)
    if (stats.total === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '8px' }}>
          <p style={{ fontSize: '16px', margin: 0 }}>No skills sedimented yet</p>
          <p style={{ fontSize: '13px', margin: 0, opacity: 0.7 }}>Run a tournament with this regime to generate skills.</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Stats bar */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            padding: '16px 20px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-light)',
            fontSize: '14px',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>Total:</span>
            <span style={{ fontWeight: 600 }}>{stats.total}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>Unique Topics:</span>
            <span style={{ fontWeight: 600 }}>{stats.uniqueTopics.length}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>Duplicates:</span>
            <span style={{ fontWeight: 600, color: stats.stats.duplicateCount > 0 ? 'var(--accent-gold)' : 'inherit' }}>
              {stats.stats.duplicateCount}
            </span>
          </div>
        </div>

        {/* Unique topics */}
        {stats.uniqueTopics.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {stats.uniqueTopics.map((topic) => (
              <span
                key={topic}
                style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: 'var(--accent-blue)',
                  fontSize: '12px',
                }}
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* Skill list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stats.skills.map((skill) => {
            const isDuplicate = duplicateSet.has(skill.filename);
            return (
              <div
                key={skill.filename}
                className="glass-panel"
                style={{
                  padding: '16px',
                  border: isDuplicate ? '1px solid rgba(234, 179, 8, 0.3)' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{skill.name || skill.filename}</span>
                      {isDuplicate && (
                        <span style={{ fontSize: '12px', color: 'var(--accent-gold)', fontWeight: 600 }}>
                          ⚠ Duplicate
                        </span>
                      )}
                    </div>
                    {skill.description && (
                      <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {skill.description}
                      </p>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>File: {skill.filename}</span>
                      {skill.auditedBy && <span>Audited by: {skill.auditedBy}</span>}
                      <span>Size: {formatBytes(skill.sizeBytes)}</span>
                      <span>Modified: {formatTime(skill.mtime)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pending approval (staging) section */}
        {renderStagingSection()}
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gap: '20px',
        minHeight: '600px',
      }}
    >
      {/* Left sidebar: regime list */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, padding: '0 12px 12px', borderBottom: '1px solid var(--border-light)', marginBottom: '8px' }}>
          Regimes ({regimes.length})
        </div>
        {renderRegimeList()}
      </div>

      {/* Right: skill details */}
      <div className="glass-panel" style={{ padding: '24px', overflow: 'auto' }}>
        {renderSkillDetails()}
      </div>
    </div>
  );
};

export default SkillLibrary;
