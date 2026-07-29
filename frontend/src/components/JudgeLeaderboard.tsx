import React, { useState } from 'react';
import { Award, Star } from 'lucide-react';
import type { TournamentManifest } from '../types/api';

interface ScoreDetails {
  legality: number;
  feasibility: number;
  resilience: number;
}

interface JudgeLeaderboardProps {
  manifest?: TournamentManifest; // Real tournament manifest containing structured judge scores/topRegime
  judgeResult?: string; // Real markdown results from result.md
  scores?: { [regime: string]: ScoreDetails };
  verdicts?: { [regime: string]: string };
  civNames?: { [regime: string]: string };
}

interface ParsedRank {
  rank: number;
  civ: string;
  score: number;
  reason: string;
}

// Simple parser for result.md markdown table
function parseResultMarkdown(md: string): { ranks: ParsedRank[], verdict: string } {
  const lines = md.split('\n');
  const ranks: ParsedRank[] = [];
  let verdict = '';
  let inVerdict = false;
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## Verdict') || trimmed.toLowerCase().includes('verdict')) {
      inVerdict = true;
      continue;
    }
    if (inVerdict) {
      verdict += line + '\n';
      continue;
    }
    
    // Parse table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (trimmed.toLowerCase().includes('rank') || trimmed.includes('---')) {
        inTable = true;
        continue;
      }
      if (inTable) {
        const parts = trimmed.split('|').map(p => p.trim());
        // parts will be e.g. ["", "Rank", "Civilization", "Score /10", "One-line reason", ""]
        if (parts.length >= 5) {
          const rNum = parseInt(parts[1]) || (ranks.length + 1);
          const civ = parts[2] || '';
          const scoreStr = parts[3] || '';
          const scoreVal = parseFloat(scoreStr.replace('/10', '')) || 7.0;
          const reason = parts[4] || '';
          ranks.push({ rank: rNum, civ, score: scoreVal, reason });
        }
      }
    }
  }

  return { ranks, verdict: verdict.trim() };
}

export const JudgeLeaderboard: React.FC<JudgeLeaderboardProps> = ({
  manifest,
  judgeResult,
  scores = {},
  verdicts = {},
  civNames = {},
}) => {
  // Check if we have a real manifest with judge scores
  const hasRealManifest = !!manifest && !!manifest.judge && Array.isArray(manifest.judge.scores) && manifest.judge.scores.length > 0;
  
  // Parse result.md if available
  const hasRealResult = !!judgeResult;
  const parsed = hasRealResult ? parseResultMarkdown(judgeResult!) : { ranks: [], verdict: '' };

  // Determine available regimes
  let regimes: string[] = [];
  if (hasRealManifest) {
    regimes = manifest.judge.scores!.map(s => s.regime);
  } else if (hasRealResult) {
    regimes = parsed.ranks.map(r => r.civ);
  } else {
    regimes = Object.keys(scores);
  }

  // Determine default selected regime: prefer topRegime from manifest, then first in list
  const initialRegime = (hasRealManifest && manifest.judge.topRegime) 
    ? manifest.judge.topRegime 
    : (regimes[0] || null);

  const [selectedRegime, setSelectedRegime] = useState<string | null>(initialRegime);

  // Set default selected regime if regimes changes
  React.useEffect(() => {
    if (regimes.length > 0) {
      if (!selectedRegime || !regimes.includes(selectedRegime)) {
        const topReg = (hasRealManifest && manifest.judge.topRegime) 
          ? manifest.judge.topRegime 
          : regimes[0];
        setSelectedRegime(topReg);
      }
    }
  }, [manifest, judgeResult, regimes, selectedRegime]);

  if (regimes.length === 0) {
    return (
      <div className="glass-panel p-8 text-center text-[var(--text-muted)]" style={{ padding: '32px', textAlign: 'center' }}>
        No evaluation results delivered yet. Complete a tournament to view the judge's leaderboard.
      </div>
    );
  }

  const getAverageScore = (regime: string) => {
    if (hasRealManifest) {
      const s = manifest.judge.scores!.find(item => item.regime === regime);
      return s ? s.score.toFixed(1) : '7.0';
    } else if (hasRealResult) {
      const r = parsed.ranks.find(rank => rank.civ === regime || rank.civ.includes(regime) || regime.includes(rank.civ));
      return r ? r.score.toFixed(1) : '7.0';
    } else {
      const s = scores[regime];
      if (!s) return '0.0';
      return ((s.legality + s.feasibility + s.resilience) / 3).toFixed(1);
    }
  };

  const getGradeBadge = (avg: number) => {
    if (avg >= 9.0) return { label: 'S', color: 'var(--accent-gold)' };
    if (avg >= 8.0) return { label: 'A', color: 'var(--accent-cyan)' };
    if (avg >= 7.0) return { label: 'B', color: 'var(--accent-purple)' };
    if (avg >= 5.0) return { label: 'C', color: 'var(--text-secondary)' };
    return { label: 'D', color: 'var(--accent-crimson)' };
  };

  const sortedRegimes = hasRealManifest
    ? regimes
    : hasRealResult
      ? regimes
      : [...regimes].sort((a, b) => {
          const avgA = parseFloat(getAverageScore(a));
          const avgB = parseFloat(getAverageScore(b));
          return avgB - avgA;
        });

  const getCivName = (regime: string) => {
    const parts = regime.split('/');
    const name = parts[parts.length - 1];
    return civNames[regime] || name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getSelectedReason = (regime: string) => {
    if (hasRealResult) {
      const r = parsed.ranks.find(rank => rank.civ === regime || rank.civ.includes(regime) || regime.includes(rank.civ));
      return r ? r.reason : '';
    }
    return '';
  };

  const hasRealData = hasRealManifest || hasRealResult;

  return (
    <div className="glass-panel glass-panel-gold p-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[rgba(255,215,0,0.05)] border border-[var(--border-glow-gold)] text-[var(--accent-gold)] shadow-[var(--shadow-glow-gold)]">
          <Award size={24} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-wide">AI Judge Leaderboard</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Comparative evaluation based on historical constraint compliance, project feasibility, and systemic resilience.
          </p>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Score Table */}
        <div className="md:col-span-1 border-r border-[var(--border-subtle)] pr-0 md:pr-8">
          <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">
            REGIME STANDINGS
          </h3>
          <div className="space-y-3">
            {sortedRegimes.map((regime, index) => {
              const avg = parseFloat(getAverageScore(regime));
              const grade = getGradeBadge(avg);
              const isSelected = selectedRegime === regime;

              return (
                <div
                  key={regime}
                  onClick={() => setSelectedRegime(regime)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-[var(--bg-glass-heavy)] border-[var(--border-glow-gold)] shadow-[var(--shadow-glow-gold)]'
                      : 'bg-[var(--bg-surface-raised)] border-[var(--border-subtle)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-glass-medium)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-[var(--text-muted)] w-5 font-bold">
                      #{index + 1}
                    </span>
                    <div>
                      <span className="text-sm font-bold block text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                        {getCivName(regime)}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] block font-mono mt-0.5">
                        {regime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-black block font-mono text-[var(--text-primary)]">
                        {avg}
                      </span>
                      <span className="text-[8px] text-[var(--text-muted)] font-bold tracking-widest block">SCORE</span>
                    </div>
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-[var(--shadow-glass)]"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: `2px solid ${grade.color}`,
                        color: grade.color,
                        boxShadow: `0 0 10px ${grade.color}40`
                      }}
                    >
                      {grade.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Details & Bar Charts */}
        <div className="md:col-span-2 space-y-6">
          {selectedRegime && (
            <div className="space-y-6">
              
              {/* Detailed Scores */}
              {hasRealData ? (
                /* Unified Score Display for Real Data */
                <div className="glass-panel p-6 bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-gold)] shadow-[var(--shadow-glow-gold)]"></div>
                  <div className="flex justify-between items-center mb-4 pl-2">
                    <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">OVERALL GOVERNANCE SCORE</span>
                    <span className="text-2xl font-black font-mono text-[var(--accent-gold)] drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">
                      {getAverageScore(selectedRegime)}/10
                    </span>
                  </div>
                  <div className="w-full bg-[var(--bg-glass-light)] h-3 rounded-full overflow-hidden mb-5">
                    <div 
                      className="bg-[var(--accent-gold)] h-full rounded-full transition-all duration-1000 shadow-[var(--shadow-glow-gold)]" 
                      style={{ width: `${parseFloat(getAverageScore(selectedRegime)) * 10}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] italic leading-relaxed p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)]">
                    <strong className="text-[var(--text-primary)] font-bold">Judge Summary:</strong> {getSelectedReason(selectedRegime)}
                  </div>
                </div>
              ) : (
                /* 3-Dimension Score Display for Demo Mode */
                scores[selectedRegime] && (
                  <div className="grid grid-cols-3 gap-6">
                    {/* Legality Card */}
                    <div className="glass-panel p-5 bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] rounded-xl text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-gold)] shadow-[var(--shadow-glow-gold)]"></div>
                      <span className="text-[10px] text-[var(--text-muted)] block font-bold uppercase tracking-widest mb-2">LEGALITY</span>
                      <span className="text-2xl font-black font-mono text-[var(--accent-gold)] drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">
                        {scores[selectedRegime].legality}/10
                      </span>
                      <div className="w-full bg-[var(--bg-glass-light)] h-2 rounded-full overflow-hidden mt-3">
                        <div 
                          className="bg-[var(--accent-gold)] h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${scores[selectedRegime].legality * 10}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Feasibility Card */}
                    <div className="glass-panel p-5 bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] rounded-xl text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-cyan)] shadow-[var(--shadow-glow-cyan)]"></div>
                      <span className="text-[10px] text-[var(--text-muted)] block font-bold uppercase tracking-widest mb-2">FEASIBILITY</span>
                      <span className="text-2xl font-black font-mono text-[var(--accent-cyan)] drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
                        {scores[selectedRegime].feasibility}/10
                      </span>
                      <div className="w-full bg-[var(--bg-glass-light)] h-2 rounded-full overflow-hidden mt-3">
                        <div 
                          className="bg-[var(--accent-cyan)] h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${scores[selectedRegime].feasibility * 10}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Resilience Card */}
                    <div className="glass-panel p-5 bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] rounded-xl text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-purple)] shadow-[var(--shadow-glow-purple)]"></div>
                      <span className="text-[10px] text-[var(--text-muted)] block font-bold uppercase tracking-widest mb-2">RESILIENCE</span>
                      <span className="text-2xl font-black font-mono text-[var(--accent-purple)] drop-shadow-[0_0_5px_rgba(189,0,255,0.5)]">
                        {scores[selectedRegime].resilience}/10
                      </span>
                      <div className="w-full bg-[var(--bg-glass-light)] h-2 rounded-full overflow-hidden mt-3">
                        <div 
                          className="bg-[var(--accent-purple)] h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${scores[selectedRegime].resilience * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Verdict Verdict Section */}
              <div className="glass-panel p-6 bg-[var(--bg-glass-medium)] border-[var(--border-subtle)] rounded-xl space-y-4">
                <div className="flex items-center gap-3 text-[var(--accent-gold)]">
                  <Star size={16} className="fill-[var(--accent-gold)] drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
                  <h4 className="text-sm font-black uppercase tracking-widest font-heading">
                    AI JUDGE VERDICT & COMPLIANCE FEEDBACK
                  </h4>
                </div>

                <div className="text-sm text-[var(--text-primary)] leading-relaxed font-mono bg-[var(--bg-surface)] p-5 rounded-lg border border-[var(--border-subtle)] max-h-72 overflow-y-auto scroll-fade-y shadow-[inset_var(--shadow-glass)]">
                  {hasRealData ? (
                    parsed.verdict ? (
                      parsed.verdict.split('\n').map((line, idx) => (
                        <p key={idx} className="mb-2 text-[var(--text-secondary)]">{line}</p>
                      ))
                    ) : (
                      <span className="text-[var(--text-muted)] italic">No detailed analysis compiled by the judge.</span>
                    )
                  ) : verdicts[selectedRegime] ? (
                    verdicts[selectedRegime].split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('###')) {
                        return <h4 key={pIdx} className="text-base font-bold mt-4 mb-2 text-[var(--accent-cyan)] drop-shadow-[0_0_3px_rgba(0,240,255,0.3)]">{paragraph.replace('###', '').trim()}</h4>;
                      }
                      if (paragraph.startsWith('-')) {
                        return (
                          <ul key={pIdx} className="list-disc list-inside ml-4 mb-3 text-[var(--text-secondary)] space-y-1">
                            {paragraph.split('\n').map((li, lIdx) => (
                              <li key={lIdx} className="mb-1">{li.replace('-', '').trim()}</li>
                            ))}
                          </ul>
                        );
                      }
                      return <p key={pIdx} className="mb-3 text-[var(--text-secondary)]">{paragraph}</p>;
                    })
                  ) : (
                    <span className="text-[var(--text-muted)] italic">No detailed analysis compiled by the judge.</span>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default JudgeLeaderboard;
