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

  // A control signal has to be distinguishable from prose ABOUT that control.
  // "驳回" is an ordinary word: 33 of the 57 regime files contain 驳回/诏书/圣旨
  // as plain historical vocabulary, and only [VETO] is ever taught to agents as
  // a marker. Matching the bare word killed a real Tang run mid-draft — the
  // Secretariat was describing the Chancellery's power to amend and return
  // documents ("直接在文书上批改驳回") and the engine SIGKILLed the process.
  it('does NOT fire on 驳回 used as ordinary prose', () => {
    const ctx = makeContext();
    assert.equal(checkVeto('对六部执行中的不当，可直接在文书上批改驳回。', ctx), false);
    assert.equal(ctx.vetoTriggered, false, 'and must not mark the match as vetoed');
  });

  it('fires on the explicit bracketed marker', () => {
    const ctx = makeContext();
    assert.equal(checkVeto('门下省封驳此诏 [VETO]', ctx), true);
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

  it('detects the bracketed Chinese 弹劾 marker', () => {
    const ctx = makeContext();
    // Unbracketed "弹劾：李林甫" is ordinary narration of a censorate's duties
    // and no longer fires; the bracketed form is an act.
    assert.equal(checkImpeach('御史台弹劾：李林甫，风闻言事', ctx), false);
    assert.equal(checkImpeach('[弹劾: 李林甫]', ctx), true);
    assert.ok(ctx.impeachments.has('李林甫'));
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

  // 诏书 ("edict") is the most common noun in a Tang governance document. Firing
  // EDICT on it grants vetoImmunity, which disables the veto mechanism — so
  // under captured office prose a checks-and-balances regime would silently
  // lose the very behaviour under study.
  it('does NOT fire on 诏书/圣旨 used as ordinary prose', () => {
    const ctx = makeContext();
    assert.equal(checkEdict('交门下省封驳，诏书既下，付尚书省施行。', ctx), false);
    assert.equal(checkEdict('皇帝下达圣旨的流程如下', ctx), false);
    assert.equal(ctx.vetoImmunity, false, 'veto immunity must not be granted by prose');
  });

  it('fires on the explicit bracketed marker', () => {
    const ctx = makeContext();
    assert.equal(checkEdict('[EDICT] 敕令直下六部', ctx), true);
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

describe('control signals vs prose about control signals', () => {
  // The class of defect, stated once. All three mechanisms matched bare natural
  // language, which is indistinguishable from a regime describing its own
  // constitution — exactly what its offices spend their output doing. The bare
  // matches were only dormant because office deliberation was being discarded
  // before it reached the scanner.
  const PROSE = [
    '门下省给事中对所有防疫诏令有封驳之权，违制即封还。',
    '对六部执行中的不当，可直接在文书上批改驳回。',
    '中书省起草诏书，交门下省审核，再付尚书省施行。',
    '御史台可风闻言事，弹劾：不法官员，直达御前。',
    '皇帝下达圣旨的流程见上。',
  ].join('\n');

  it('a regime describing its own constitution triggers nothing', () => {
    const engine = new MechanismEngine({ emit: () => {} }, { kill: () => {} });
    const fired = engine.process(PROSE);
    assert.deepEqual(fired, { veto: false, impeach: false, edict: false },
      'prose about vetoes, edicts and impeachments is not an act of any of them');
    assert.deepEqual(engine.getStats(), { vetoes: 0, impeachments: 0, edicts: 0 });
  });

  it('but the explicit markers still work', () => {
    const engine = new MechanismEngine({ emit: () => {} }, { kill: () => {} });
    assert.equal(engine.process('[EDICT] 敕').edict, true);
    assert.equal(engine.process('[IMPEACH: 李林甫]').impeach, true);
    assert.deepEqual(engine.getImpeachments(), ['李林甫']);
  });
});

describe('the marker taught to agents is the marker the engine detects', () => {
  // Codex pre-merge review, P1. The bare-substring removal was correct, but it
  // left the OTHER half of the contract untouched: engine/regime-to-cc.mjs was
  // still teaching reviewers to write "VETO:" while checkVeto only accepted
  // "[VETO]". Every checks-and-balances regime therefore had a veto power that
  // no agent could exercise — and all 472 tests stayed green, because the
  // mechanism tests hand-write the bracketed marker instead of taking it from a
  // real compiled prompt. A test that supplies its own correct input cannot
  // notice that the production input is wrong.
  it('a real compiled reviewer prompt teaches a marker checkVeto accepts', async () => {
    const { convertRegime } = await import('../engine/regime-to-cc.mjs');
    const { agents } = convertRegime('./regimes/china/tang');
    // Only the offices actually GRANTED the power must be taught how to use it;
    // other offices merely have it described to them.
    const reviewers = Object.entries(agents)
      .filter(([, a]) => /\[CONSTITUTIONAL VETO POWER\]/.test(a.prompt ?? ''));
    assert.ok(reviewers.length > 0, 'tang must compile at least one veto-bearing office');

    for (const [id, agent] of reviewers) {
      const taught = agent.prompt.match(/\[VETO\]|\[封驳\]/);
      assert.ok(taught, `${id} is told about VETO but never taught a bracketed marker`);
      const ctx = makeContext();
      assert.equal(
        checkVeto(`${taught[0]} the draft is unlawful`, ctx), true,
        `${id} is taught ${taught[0]}, which the engine must accept`,
      );
    }
  });

  it('the unbracketed form the compiler used to teach still does nothing', () => {
    // Kept as a live reminder of what the defect looked like: this is the exact
    // string every Tang reviewer was instructed to emit, and it is inert.
    const ctx = makeContext();
    assert.equal(checkVeto('VETO: legality defect', ctx), false);
    assert.equal(ctx.vetoTriggered, false);
  });
});
