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
  dims?: { legality?: number; feasibility?: number; resilience?: number };
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
  // skill events: saved|rejected|skipped|error|staged; match_end: done|vetoed|failed
  status?: 'saved' | 'rejected' | 'skipped' | 'error' | 'staged' | 'done' | 'vetoed' | 'failed';
  skillPath?: string;
  contentHash?: string;
  reason?: string;
  auditedBy?: string | null;
  exitCode?: number | null;
  signal?: string | null;
  target?: string;             // impeach_triggered
  mechanisms?: { vetoes: number; impeachments: number; edicts: number };
  meta?: unknown;
  // OTel-style envelope (schema v2, all optional for backward compatibility)
  event_id?: string;
  schema_version?: string;
  trace_id?: string;
  span_id?: string;
  parent_span_id?: string | null;
  kind?: 'llm_call' | 'tool_call' | 'judge_score' | 'skill_propose' | 'skill_commit' | 'turn' | 'match_start' | 'match_end';
  model?: string;
  model_version?: string;
  prompt_hash?: string;
  tokens?: number;
  cost?: number;
  payload_hash?: string;
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
    swap?: boolean;     // whether the order-swapped second judge pass ran
    passes?: number;    // judge passes actually completed
    rubric?: { scale: string; dimensions: string[] };
    events?: string;    // absolute path to the tournament-level judge_score events.jsonl
  };
}

export interface TournamentSummary {
  id: string;
  manifest: TournamentManifest;
  judgeResult?: string;
}

// ── Regime topology (governance graph) ──────────────────────────────────────

export type FunctionalRole =
  | 'coordinator' | 'engineering' | 'review' | 'research' | 'data'
  | 'devops' | 'content' | 'legal' | 'management';

export type EdgeKind = 'command' | 'review' | 'info' | 'veto';

export interface TopologyNode {
  id: string;
  label: string;
  functional_role: FunctionalRole;
}

export interface TopologyEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  note?: string;
}

export interface RegimeTopology {
  schema_version: string;
  regime: string;
  mode: string;
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export interface TopologyMetrics {
  regime: string;
  mode: string;
  nodes: number;
  edges: number;
  density: number;
  command_depth: number;
  top_in_degree: { id: string; inDegree: number }[];
  in_degree: { id: string; inDegree: number }[];
  checks_cycles: number;
  checks_cycle_nodes: string[][];
}

export interface TopologyResponse {
  id: string;
  region: string;
  topology: RegimeTopology;
  metrics: TopologyMetrics;
}

// ── Cross-tournament statistics (Bradley-Terry rankings) ────────────────────

export interface RankingRow {
  regime: string;
  ability: number;
  ci95: [number, number];
  rank: number;
  rankCi95: [number, number];
  medianRank: number;
  games: number;
}

export interface PairwiseRow {
  a: string;
  b: string;
  games: number;
  winsA: number;
  winsB: number;
  logAbilityDiff: number;
  ci95: [number, number];
  significant: boolean;
}

export interface StatsRankingsResponse {
  rankings: RankingRow[];
  pairwise: PairwiseRow[];
  warnings: string[];
  tournamentsUsed: number;
  regimes: string[];
  B: number;
  minSample: number;
}
