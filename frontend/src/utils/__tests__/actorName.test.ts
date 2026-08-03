import { describe, expect, it } from 'vitest';
import { splitActor } from '../actorName';

describe('splitActor', () => {
  it('preserves legacy actors and splits only the first #', () => {
    expect(splitActor('emperor')).toEqual({ regime: 'emperor', office: '' });
    expect(splitActor('china/tang#menxia')).toEqual({
      regime: 'china/tang',
      office: 'menxia',
    });
    expect(splitActor('china/tang#bingbu#sub#2')).toEqual({
      regime: 'china/tang',
      office: 'bingbu#sub#2',
    });
    expect(splitActor('')).toEqual({ regime: '', office: '' });
    expect(splitActor(undefined)).toEqual({ regime: '', office: '' });
    expect(splitActor(123)).toEqual({ regime: '', office: '' });
  });
});
