import { describe, it, expect } from 'vitest';
import { labelParticipation, readParticipation } from '../participation';

describe('topology participation payload', () => {
  it('keeps observed, negative, and unknown evidence semantically distinct', () => {
    for (const malformed of [undefined, null, 'not_observed', 42, { status: 'invalid' }]) {
      const report = readParticipation(malformed);
      expect(report.status).toBe('unknown');
      expect(labelParticipation(report).text).toContain('数据不足');
      expect(labelParticipation(report).text).not.toContain('未观察');
    }

    const absent = readParticipation({
      status: 'not_observed',
      dispatchCount: 0,
      officeTurnCount: 0,
      officesInvoked: [],
      officeCount: 0,
    });
    const absentLabel = labelParticipation(absent);
    expect(absentLabel.text).toBe('未观察到职官派工');
    expect(absentLabel.detail).toContain('不等于已证明声明边未执行');
    expect(absentLabel.text).not.toContain('拓扑无效');

    const observed = readParticipation({
      status: 'participation_observed',
      dispatchCount: 3.8,
      officeTurnCount: 2,
      officesInvoked: ['menxia', 42, '', 'zhongshu'],
      officeCount: 2,
    });
    expect(observed).toEqual({
      status: 'participation_observed',
      dispatchCount: 3,
      officeTurnCount: 2,
      officesInvoked: ['menxia', 'zhongshu'],
      officeCount: 2,
    });
    const observedLabel = labelParticipation(observed);
    expect(observedLabel.text).toBe('观察到职官参与');
    expect(observedLabel.detail).toContain('3 次派工');
    expect(observedLabel.detail).toContain('2 次职官发言');
    expect(observedLabel.detail).toContain('menxia');
  });
});
