// API Type Declarations for CivAgent

export interface RegimeMetadata {
  id: string;
  name?: string | { zh: string; en: string };
  era?: { zh: string; en: string };
  epoch?: string;
  region?: 'china' | 'global' | string;
  system?: { zh: string; en: string };
  description?: { zh: string; en: string };
  agentCount?: number;
  orchestrationPattern: string;
  tags?: string[];
}

export interface LearnedSkill {
  filename: string;
  content: string; // The markdown representation
}

export interface RegimeDetail {
  id: string;
  metadata: RegimeMetadata;
  identity: string; // IDENTITY.md markdown content
  soul: string;     // SOUL.md markdown content
  skills: LearnedSkill[];
}

export interface JudgeScore {
  regime: string;
  score: number;
  reason?: string;
}

export interface MatchEvent {
  matchId: string;
  regime?: string;
  backend?: string;
  ts: number;
  type:
    | 'match_start' | 'turn' | 'tool' | 'judge' | 'skill' | 'match_end' | 'chunk'
    | 'veto_triggered' | 'impeach_triggered' | 'edict_triggered';
  seq: number;
  actor?: string;
  text?: string;
  // skill events: saved|rejected|skipped|error; match_end: done|vetoed|failed
  status?: 'saved' | 'rejected' | 'skipped' | 'error' | 'done' | 'vetoed' | 'failed';
  skillPath?: string;
  reason?: string;
  auditedBy?: string | null;
  exitCode?: number | null;
  signal?: string | null;
  target?: string;             // impeach_triggered
  mechanisms?: { vetoes: number; impeachments: number; edicts: number };
  meta?: unknown;
}

export interface MatchMeta {
  matchId: string;
  regime: string;
  backend: string;
  task?: string;
  tsStart?: number;
  tsEnd?: number;
  exitCode?: number;
  sediment?: string | {
    saved?: string;
    rejected?: string;
    skipped?: string;
    error?: string;
    auditedBy?: string;
  };
  prompt?: string;
  [key: string]: unknown;
}

export interface MatchSummary {
  id: string;
  format: 'legacy' | 'structured';
  mtime: number;
  meta: MatchMeta;
}

export interface TournamentCiv {
  regime: string;
  backend: string;
  matchId: string;
  exitCode: number | null;
  events: string; // absolute path to events.jsonl
}

export interface TournamentManifest {
  id: string;
  task: string;
  createdAt: number;
  civs: TournamentCiv[];
  judge: {
    provider: string | null;
    resultPath: string; // absolute path to result.md
    scores?: JudgeScore[];
    topRegime?: string | null;
  };
}

export interface TournamentSummary {
  id: string;
  manifest: TournamentManifest;
  judgeResult?: string;
}
