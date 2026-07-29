import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkVeto } from '../engine/mechanisms/veto.mjs';
import { checkImpeach } from '../engine/mechanisms/impeach.mjs';
import { checkEdict } from '../engine/mechanisms/edict.mjs';
import { MechanismEngine } from '../engine/mechanisms/index.mjs';

// Minimal mock for context objects
function makeContext() {
  return {
    vetoTriggered: false,
    vetoImmunity: false,
    edictTriggered: false,
    impeachments: new Set(),
    log: { emit: () => {} },
    ccProcess: { kill: () => {} },
  };
}

describe('checkVeto', () => {
  it('detects [VETO] keyword', () => {
    const ctx = makeContext();
    assert.equal(checkVeto('The Chancellery issues [VETO] on this proposal.', ctx), true);
    assert.equal(ctx.vetoTriggered, true);
  });

  it('detects Chinese 驳回 keyword', () => {
    const ctx = makeContext();
    assert.equal(checkVeto('门下省决定驳回此诏书', ctx), true);
  });

  it('does not trigger twice', () => {
    const ctx = makeContext();
    checkVeto('[VETO]', ctx);
    assert.equal(checkVeto('[VETO]', ctx), false);
  });

  it('is blocked by vetoImmunity (Edict override)', () => {
    const ctx = makeContext();
    ctx.vetoImmunity = true;
    assert.equal(checkVeto('[VETO]', ctx), false);
  });

  it('does not trigger on unrelated text', () => {
    const ctx = makeContext();
    assert.equal(checkVeto('This is a normal policy discussion.', ctx), false);
  });
});

describe('checkImpeach', () => {
  it('detects [IMPEACH: target] format', () => {
    const ctx = makeContext();
    assert.equal(checkImpeach('The Censorate issues [IMPEACH: Grand Secretary] for corruption.', ctx), true);
    assert.ok(ctx.impeachments.has('Grand Secretary'));
  });

  it('detects Chinese 弹劾 format', () => {
    const ctx = makeContext();
    assert.equal(checkImpeach('都察院决定弹劾：丞相', ctx), true);
    assert.ok(ctx.impeachments.has('丞相'));
  });

  it('does not impeach the same target twice', () => {
    const ctx = makeContext();
    checkImpeach('[IMPEACH: Chancellor]', ctx);
    assert.equal(checkImpeach('[IMPEACH: Chancellor]', ctx), false);
  });

  it('can impeach different targets', () => {
    const ctx = makeContext();
    assert.equal(checkImpeach('[IMPEACH: Chancellor]', ctx), true);
    assert.equal(checkImpeach('[IMPEACH: General]', ctx), true);
    assert.equal(ctx.impeachments.size, 2);
  });
});

describe('checkEdict', () => {
  it('detects [EDICT] keyword', () => {
    const ctx = makeContext();
    assert.equal(checkEdict('The Emperor issues [EDICT] to bypass the council.', ctx), true);
    assert.equal(ctx.vetoImmunity, true);
  });

  it('detects Chinese 圣旨', () => {
    const ctx = makeContext();
    assert.equal(checkEdict('皇帝下达圣旨', ctx), true);
  });

  it('detects Chinese 诏书', () => {
    const ctx = makeContext();
    assert.equal(checkEdict('发布诏书征调兵马', ctx), true);
  });

  it('does not trigger twice', () => {
    const ctx = makeContext();
    checkEdict('[EDICT]', ctx);
    assert.equal(checkEdict('[EDICT]', ctx), false);
  });
});

describe('MechanismEngine', () => {
  it('processes all mechanisms in order', () => {
    const engine = new MechanismEngine(
      { emit: () => {} },
      { kill: () => {} },
      ['VETO', 'IMPEACH', 'EDICT']
    );
    const result = engine.process('[EDICT] The Emperor decrees [IMPEACH: Chancellor] and issues a mandate.');
    assert.equal(result.edict, true);
    assert.equal(result.impeach, true);
    // Veto should be blocked by the edict's vetoImmunity
  });

  it('respects allowed mechanisms filter', () => {
    const engine = new MechanismEngine(
      { emit: () => {} },
      { kill: () => {} },
      ['VETO'] // only VETO allowed
    );
    const result = engine.process('[EDICT] decree [IMPEACH: target]');
    assert.equal(result.edict, false);
    assert.equal(result.impeach, false);
  });

  it('tracks stats correctly', () => {
    const engine = new MechanismEngine(
      { emit: () => {} },
      { kill: () => {} },
      ['IMPEACH']
    );
    engine.process('[IMPEACH: A]');
    engine.process('[IMPEACH: B]');
    const stats = engine.getStats();
    assert.equal(stats.impeachments, 2);
    assert.equal(stats.vetoes, 0);
    assert.equal(stats.edicts, 0);
  });

  it('resetTurn clears per-turn state', () => {
    const engine = new MechanismEngine(
      { emit: () => {} },
      { kill: () => {} },
      ['EDICT']
    );
    engine.process('[EDICT]');
    assert.equal(engine.context.edictTriggered, true);
    engine.resetTurn();
    assert.equal(engine.context.edictTriggered, false);
    // Stats should be preserved
    assert.equal(engine.getStats().edicts, 1);
  });

  it('getImpeachments returns target list', () => {
    const engine = new MechanismEngine(
      { emit: () => {} },
      { kill: () => {} },
      ['IMPEACH']
    );
    engine.process('[IMPEACH: Chancellor]');
    engine.process('[IMPEACH: General]');
    const targets = engine.getImpeachments();
    assert.deepEqual(targets.sort(), ['Chancellor', 'General']);
  });
});
