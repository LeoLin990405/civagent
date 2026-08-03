// Split an `event.actor` identifier of the form `regime#office` into its two
// parts. The convention is:
//
//   regime = substring before the FIRST '#'
//   office = the FULL remainder after that first '#'
//           (which may itself contain further '#' characters — they are part
//            of the office suffix and must NOT be mis-parsed as a regime id)
//
// When the actor contains no '#', the value is treated as a regime-only
// identifier: regime === input, office === ''. Undefined / null / non-string
// inputs collapse to a single empty regime with no office so callers can
// always render two strings.

export interface ActorParts {
  readonly regime: string;
  readonly office: string;
}

export function splitActor(actor: unknown): ActorParts {
  if (typeof actor !== 'string' || actor.length === 0) {
    return { regime: '', office: '' };
  }
  const hashIndex = actor.indexOf('#');
  if (hashIndex < 0) {
    // No separator — preserve legacy display verbatim.
    return { regime: actor, office: '' };
  }
  return {
    regime: actor.slice(0, hashIndex),
    office: actor.slice(hashIndex + 1),
  };
}
