export type TopologyParticipationStatus =
  | 'participation_observed'
  | 'not_observed'
  | 'unknown';

export interface TopologyParticipation {
  readonly status: TopologyParticipationStatus;
  readonly dispatchCount: number;
  readonly officeTurnCount: number;
  readonly officesInvoked: readonly string[];
  readonly officeCount: number;
}

export interface ParticipationLabel {
  readonly text: string;
  readonly detail: string;
  readonly tone: 'observed' | 'not_observed' | 'unknown';
  readonly testId: string;
}

const UNKNOWN: TopologyParticipation = {
  status: 'unknown',
  dispatchCount: 0,
  officeTurnCount: 0,
  officesInvoked: [],
  officeCount: 0,
};

export function readParticipation(value: unknown): TopologyParticipation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return UNKNOWN;
  const raw = value as Record<string, unknown>;
  const status: TopologyParticipationStatus =
    raw.status === 'participation_observed' || raw.status === 'not_observed'
      ? raw.status
      : 'unknown';
  const number = (candidate: unknown): number =>
    typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0
      ? Math.floor(candidate)
      : 0;
  const officesInvoked = Array.isArray(raw.officesInvoked)
    ? raw.officesInvoked.filter(
      (office): office is string => typeof office === 'string' && office.length > 0,
    )
    : [];
  return {
    status,
    dispatchCount: number(raw.dispatchCount),
    officeTurnCount: number(raw.officeTurnCount),
    officesInvoked,
    officeCount: number(raw.officeCount),
  };
}

export function labelParticipation(report: TopologyParticipation): ParticipationLabel {
  if (report.status === 'participation_observed') {
    const facts: string[] = [];
    if (report.dispatchCount > 0) facts.push(`${report.dispatchCount} 次派工`);
    if (report.officeTurnCount > 0) facts.push(`${report.officeTurnCount} 次职官发言`);
    if (report.officesInvoked.length > 0) {
      facts.push(`职官：${report.officesInvoked.join('、')}`);
    }
    return {
      text: '观察到职官参与',
      detail: facts.join(' · '),
      tone: 'observed',
      testId: 'participation-observed',
    };
  }
  if (report.status === 'not_observed') {
    return {
      text: '未观察到职官派工',
      detail: '埋点完整；不等于已证明声明边未执行',
      tone: 'not_observed',
      testId: 'participation-not-observed',
    };
  }
  return {
    text: '职官参与：数据不足',
    detail: '旧比赛、残缺事件流或埋点能力未知',
    tone: 'unknown',
    testId: 'participation-unknown',
  };
}
