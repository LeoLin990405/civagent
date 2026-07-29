import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, AlertTriangle, CheckCircle, FileText, Code, BookOpen } from 'lucide-react';
import type {
  RegimeSummary,
  RegimeMetadata,
  RegimeEditRequest,
  RegimeEditResponse,
  RegimeEditErrorResponse,
  RegimeEditFinding,
} from '../types/api';

// ── Identity table parser (mirrors engine/regime-to-cc.mjs::parseIdentityTable) ──

interface ParsedAgent {
  historicalRole: string;
  agentId: string;
  aiRole: string;
  modelHint: string;
}

function parseIdentityTable(identityMd: string): ParsedAgent[] {
  const lines = identityMd.split('\n');
  const agents: ParsedAgent[] = [];
  let inTable = false;

  for (const line of lines) {
    if (line.includes('Agent ID') || line.includes('agent_id')) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('|')) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 3 && !cells[0].startsWith('-')) {
        const historicalRole = cells[0];
        const agentId = cells[1].replace(/`/g, '');
        const aiRole = cells[2];
        const modelHint = cells[3] || '';
        agents.push({ historicalRole, agentId, aiRole, modelHint });
      }
    } else if (inTable && !line.startsWith('|') && line.trim()) {
      inTable = false;
    }
  }
  return agents;
}

// ── Component ────────────────────────────────────────────────────────────────

export const RegimeEditor: React.FC = () => {
  const [regimes, setRegimes] = useState<RegimeSummary[]>([]);
  const [regimesLoading, setRegimesLoading] = useState(true);
  const [regimesError, setRegimesError] = useState<string | null>(null);

  const [selectedRegimeId, setSelectedRegimeId] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedRegimeDetailId, setSelectedRegimeDetailId] = useState<string | null>(null);

  // Editable fields
  const [metadataJson, setMetadataJson] = useState('');
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [identity, setIdentity] = useState('');
  const [soul, setSoul] = useState('');

  // Loaded from server (for dirty check)
  const [loadedMetadataJson, setLoadedMetadataJson] = useState('');
  const [loadedIdentity, setLoadedIdentity] = useState('');
  const [loadedSoul, setLoadedSoul] = useState('');

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveFindings, setSaveFindings] = useState<RegimeEditFinding[]>([]);

  // Unsaved changes warning
  const hasUnsavedChanges =
    metadataJson !== loadedMetadataJson ||
    identity !== loadedIdentity ||
    soul !== loadedSoul;

  const suppressBeforeUnload = useRef(false);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (suppressBeforeUnload.current) return;
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Load regime list on mount
  useEffect(() => {
    let cancelled = false;
    fetch('/api/regimes?summary=1')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load regimes: ${r.status}`);
        return r.json() as Promise<RegimeSummary[]>;
      })
      .then((data) => {
        if (!cancelled) setRegimes(data);
      })
      .catch((e) => {
        if (!cancelled)
          setRegimesError(e instanceof Error ? e.message : 'Failed to load regimes');
      })
      .finally(() => {
        if (!cancelled) setRegimesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch full regime detail when selected
  const handleSelectRegime = useCallback(
    (regimeId: string) => {
      if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Discard them?')) {
        return;
      }

      setSelectedRegimeId(regimeId);
      setSaveSuccess(null);
      setSaveError(null);
      setSaveFindings([]);

      // Parse region/id
      const parts = regimeId.split('/');
      if (parts.length < 2) return;
      const [region, id] = parts;
      setSelectedRegion(region);
      setSelectedRegimeDetailId(id);

      // Fetch identity and metadata
      fetch(`/api/regimes/${encodeURIComponent(region)}/${encodeURIComponent(id)}`)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to load regime: ${r.status}`);
          return r.json() as Promise<{ metadata: RegimeMetadata; identity: string; soul: string }>;
        })
        .then((data) => {
          const metaStr = JSON.stringify(data.metadata, null, 2);
          setMetadataJson(metaStr);
          setLoadedMetadataJson(metaStr);
          setMetadataError(null);
          setIdentity(data.identity || '');
          setLoadedIdentity(data.identity || '');
          setSoul(data.soul || '');
          setLoadedSoul(data.soul || '');
        })
        .catch(() => {
          // Fallback: try fetching identity separately
          fetch(
            `/api/regimes/${encodeURIComponent(region)}/${encodeURIComponent(id)}/identity`,
          )
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then(
              (data: { raw?: string }) => {
                setIdentity(data.raw || '');
                setLoadedIdentity(data.raw || '');
              },
            )
            .catch(() => {});
        });
    },
    [hasUnsavedChanges],
  );

  // Parse identity table for agent count preview
  const parsedAgents = parseIdentityTable(identity);
  const agentCount = parsedAgents.length;
  const identityIsEmpty = identity.trim().length === 0;

  // Validate metadata JSON
  const validateMetadataJson = useCallback((json: string): string | null => {
    if (!json.trim()) return null; // empty is allowed (no change)
    try {
      JSON.parse(json);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Invalid JSON';
    }
  }, []);

  const handleMetadataChange = useCallback(
    (value: string) => {
      setMetadataJson(value);
      setMetadataError(validateMetadataJson(value));
    },
    [validateMetadataJson],
  );

  // Save handler
  const handleSave = useCallback(async () => {
    if (!selectedRegion || !selectedRegimeDetailId) return;

    // Validate metadata
    const metaErr = validateMetadataJson(metadataJson);
    if (metaErr) {
      setMetadataError(metaErr);
      return;
    }

    // Block save if identity compiles to 0 agents
    if (!identityIsEmpty && agentCount === 0) {
      return;
    }

    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);
    setSaveFindings([]);

    const body: RegimeEditRequest = {};
    if (metadataJson.trim()) {
      body.metadata = JSON.parse(metadataJson);
    }
    body.identity = identity;
    body.soul = soul;

    try {
      const res = await fetch(
        `/api/regimes/${encodeURIComponent(selectedRegion)}/${encodeURIComponent(selectedRegimeDetailId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );

      if (res.ok) {
        const data = (await res.json()) as RegimeEditResponse;
        setSaveSuccess(data.agentCount);
        setLoadedMetadataJson(metadataJson);
        setLoadedIdentity(identity);
        setLoadedSoul(soul);
      } else {
        const data = (await res.json()) as RegimeEditErrorResponse;
        setSaveError(data.error);
        setSaveFindings(data.findings ?? []);
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSaving(false);
    }
  }, [
    selectedRegion,
    selectedRegimeDetailId,
    metadataJson,
    identity,
    soul,
    identityIsEmpty,
    agentCount,
    validateMetadataJson,
  ]);

  // ── Render helpers ────────────────────────────────────────────────────────

  const displayName = (r: RegimeSummary): string => {
    const n = r.metadata?.name;
    if (typeof n === 'object') return n.en;
    return n ?? r.id;
  };

  const renderRegimeList = () => {
    if (regimesLoading) {
      return (
        <p style={{ color: 'var(--text-muted)', padding: '16px' }}>Loading regimes...</p>
      );
    }
    if (regimesError) {
      return (
        <p style={{ color: 'var(--accent-crimson)', padding: '16px' }}>
          Error: {regimesError}
        </p>
      );
    }

    const chinaRegimes = regimes.filter((r) => r.metadata?.region === 'china');
    const globalRegimes = regimes.filter((r) => r.metadata?.region === 'global');

    const renderGroup = (title: string, list: RegimeSummary[]) => {
      if (list.length === 0) return null;
      return (
        <div key={title} style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              padding: '4px 12px',
            }}
          >
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
                  background: isSelected
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'transparent',
                  color: isSelected
                    ? 'var(--accent-blue)'
                    : 'var(--text-muted)',
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

  const renderIdentityPreview = () => {
    if (identityIsEmpty) {
      return null;
    }
    if (agentCount === 0) {
      return (
        <div
          data-testid="identity-warning"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--accent-crimson)',
            fontSize: '13px',
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>0 agents compiled.</strong> A prose-formatted IDENTITY.md parses to 0
            agents. The role-mapping table must use the markdown table format with an
            "Agent ID" header (see AGENTS.md rule #2). Save is disabled.
          </div>
        </div>
      );
    }
    return (
      <div
        data-testid="identity-preview"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          color: 'var(--accent-blue)',
          fontSize: '13px',
        }}
      >
        <CheckCircle size={14} />
        <span>
          Compiles to <strong>{agentCount}</strong> agent{agentCount !== 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  const renderSaveStatus = () => {
    if (saveSuccess !== null) {
      return (
        <div
          data-testid="save-success"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-emerald)',
            fontSize: '13px',
          }}
        >
          <CheckCircle size={16} />
          <span>
            Saved. Server compiled <strong>{saveSuccess}</strong> agent
            {saveSuccess !== 1 ? 's' : ''}.
          </span>
        </div>
      );
    }
    if (saveError) {
      return (
        <div
          data-testid="save-error"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--accent-crimson)',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <strong>{saveError}</strong>
          </div>
          {saveFindings.length > 0 && (
            <ul
              data-testid="save-findings"
              style={{ margin: 0, paddingLeft: '24px' }}
            >
              {saveFindings.map((f, i) => (
                <li key={i}>
                  <strong>[{f.rule}]</strong> {f.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    return null;
  };

  const canSave =
    selectedRegimeId !== null &&
    !saving &&
    metadataError === null &&
    (identityIsEmpty || agentCount > 0);

  // ── Main render ───────────────────────────────────────────────────────────

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
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            padding: '0 12px 12px',
            borderBottom: '1px solid var(--border-light)',
            marginBottom: '8px',
          }}
        >
          Regimes ({regimes.length})
        </div>
        {renderRegimeList()}
      </div>

      {/* Right: editor */}
      <div
        className="glass-panel"
        style={{ padding: '24px', overflow: 'auto' }}
      >
        {!selectedRegimeId ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-muted)',
            }}
          >
            <p>Select a regime to edit</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Metadata editor */}
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <Code size={16} style={{ color: 'var(--accent-blue)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                  Metadata (JSON)
                </h3>
              </div>
              <textarea
                data-testid="metadata-editor"
                value={metadataJson}
                onChange={(e) => handleMetadataChange(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%',
                  minHeight: '160px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: metadataError
                    ? '1px solid rgba(239, 68, 68, 0.5)'
                    : '1px solid var(--border-light)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
              />
              {metadataError && (
                <p
                  data-testid="metadata-error"
                  style={{
                    color: 'var(--accent-crimson)',
                    fontSize: '12px',
                    marginTop: '4px',
                  }}
                >
                  JSON syntax error: {metadataError}
                </p>
              )}
            </section>

            {/* IDENTITY.md editor */}
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                  IDENTITY.md
                </h3>
              </div>
              {renderIdentityPreview()}
              <textarea
                data-testid="identity-editor"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  marginTop: '8px',
                }}
              />
            </section>

            {/* SOUL.md editor */}
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <BookOpen size={16} style={{ color: 'var(--accent-blue)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                  SOUL.md
                </h3>
              </div>
              <textarea
                data-testid="soul-editor"
                value={soul}
                onChange={(e) => setSoul(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
              />
            </section>

            {/* Save status */}
            {renderSaveStatus()}

            {/* Save button */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                data-testid="save-button"
                onClick={handleSave}
                disabled={!canSave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: canSave
                    ? 'var(--accent-blue)'
                    : 'rgba(255,255,255,0.1)',
                  color: canSave ? '#fff' : 'var(--text-muted)',
                  cursor: canSave ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              {hasUnsavedChanges && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegimeEditor;
