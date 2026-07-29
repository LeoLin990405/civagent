import React, { useState, useEffect, useCallback } from 'react';
import type { RegimeMetadata, Scenario, TournamentLaunchRequest } from '../types/api';

const MAX_CIVS = 6;
const MAX_TASK_LENGTH = 2000;

interface TournamentLauncherProps {
  onNavigateToLive: (tournamentId: string) => void;
}

export const TournamentLauncher: React.FC<TournamentLauncherProps> = ({ onNavigateToLive }) => {
  const [regimes, setRegimes] = useState<RegimeMetadata[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedCivs, setSelectedCivs] = useState<string[]>([]);
  const [task, setTask] = useState('');
  const [backend, setBackend] = useState('native');
  const [multiJudge, setMultiJudge] = useState(false);
  const [blindCivs, setBlindCivs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load regimes and scenarios on mount
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/regimes?summary=1').then((r) => {
        if (!r.ok) throw new Error(`Failed to load regimes: ${r.status}`);
        return r.json() as Promise<RegimeMetadata[]>;
      }),
      fetch('/api/scenarios').then((r) => {
        if (!r.ok) throw new Error(`Failed to load scenarios: ${r.status}`);
        return r.json() as Promise<Scenario[]>;
      }),
    ])
      .then(([regimeData, scenarioData]) => {
        if (!cancelled) {
          setRegimes(regimeData);
          setScenarios(scenarioData);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const toggleCiv = useCallback((regimeId: string) => {
    setSelectedCivs((prev) => {
      if (prev.includes(regimeId)) {
        return prev.filter((id) => id !== regimeId);
      }
      if (prev.length >= MAX_CIVS) {
        return prev; // at limit, don't add
      }
      return [...prev, regimeId];
    });
    setValidationError(null);
  }, []);

  const pickRandomScenario = useCallback(() => {
    if (scenarios.length === 0) return;
    const idx = Math.floor(Math.random() * scenarios.length);
    setTask(scenarios[idx].prompt);
    setValidationError(null);
  }, [scenarios]);

  const validate = useCallback((): string | null => {
    if (selectedCivs.length === 0) return 'Select at least one civilization.';
    if (selectedCivs.length > MAX_CIVS) return `Maximum ${MAX_CIVS} civilizations allowed.`;
    if (!task.trim()) return 'Task prompt is required.';
    if (task.length > MAX_TASK_LENGTH) return `Task must be ${MAX_TASK_LENGTH} characters or fewer.`;
    return null;
  }, [selectedCivs, task]);

  const handleSubmit = useCallback(async () => {
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setSubmitError(null);
    setSubmitting(true);

    const body: TournamentLaunchRequest = {
      civs: selectedCivs,
      task: task.trim(),
      backend,
      judgesN: multiJudge ? 2 : 1,
      anonCivs: blindCivs,
    };

    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setSubmitError(data.error ?? `Server returned ${res.status}`);
        return;
      }

      const data = await res.json() as { tournamentId: string };
      onNavigateToLive(data.tournamentId);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }, [selectedCivs, task, backend, multiJudge, blindCivs, validate, onNavigateToLive]);

  const civsAtLimit = selectedCivs.length >= MAX_CIVS;

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading launcher data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-crimson)' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Civ selector */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
          Select Civilizations{' '}
          <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 400 }}>
            ({selectedCivs.length}/{MAX_CIVS})
          </span>
        </h3>
        {civsAtLimit && (
          <p style={{ color: 'var(--accent-gold)', fontSize: '13px', margin: '0 0 12px 0' }}>
            Maximum {MAX_CIVS} civilizations reached. Deselect one to add another.
          </p>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '8px',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {regimes.map((r) => {
            const selected = selectedCivs.includes(r.id);
            const displayName = typeof r.name === 'object' ? r.name.en : r.name ?? r.id;
            return (
              <button
                key={r.id}
                onClick={() => toggleCiv(r.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: selected ? '2px solid var(--accent-blue)' : '1px solid var(--border-light)',
                  background: selected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: selected ? 'var(--accent-blue)' : 'var(--text-muted)',
                  cursor: civsAtLimit && !selected ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                  opacity: civsAtLimit && !selected ? 0.5 : 1,
                }}
              >
                <div style={{ fontWeight: 600 }}>{displayName}</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>{r.id}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task input */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Task Prompt</h3>
        <textarea
          value={task}
          onChange={(e) => { setTask(e.target.value); setValidationError(null); }}
          placeholder="Describe the governance challenge or scenario..."
          rows={4}
          maxLength={MAX_TASK_LENGTH}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--border-light)',
            background: 'rgba(0,0,0,0.3)',
            color: 'var(--text-main)',
            fontFamily: 'inherit',
            fontSize: '14px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {task.length}/{MAX_TASK_LENGTH}
          </span>
          <button
            onClick={pickRandomScenario}
            disabled={scenarios.length === 0}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-light)',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-muted)',
              cursor: scenarios.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          >
            Random Scenario
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Options</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Backend selector */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
            <span style={{ minWidth: '80px', color: 'var(--text-muted)' }}>Backend</span>
            <select
              value={backend}
              onChange={(e) => setBackend(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-light)',
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--text-main)',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            >
              <option value="native">native</option>
              <option value="cn:doubao">cn:doubao</option>
              <option value="cn:glm">cn:glm</option>
            </select>
          </label>

          {/* Multi-judge toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={multiJudge}
              onChange={(e) => setMultiJudge(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>Multi-Judge (2 judges)</span>
          </label>

          {/* Blind civs toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={blindCivs}
              onChange={(e) => setBlindCivs(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>Blind civs (anonymous identities)</span>
          </label>
        </div>
      </div>

      {/* Validation / submit errors */}
      {validationError && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-crimson)', fontSize: '14px' }}>
          {validationError}
        </div>
      )}
      {submitError && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-crimson)', fontSize: '14px' }}>
          {submitError}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="btn btn-primary"
        style={{
          padding: '14px 32px',
          fontSize: '16px',
          fontWeight: 600,
          opacity: submitting ? 0.6 : 1,
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Launching...' : 'Launch Tournament'}
      </button>
    </div>
  );
};

export default TournamentLauncher;
