# @civagent/next contracts — P0 canonical contracts

Immutable research contracts for the `native-next-v1` runtime epoch and the
one-way `legacy-cc-v5` import boundary. This package is the only place where
Next IDs, canonical events, epoch rules, and schema versions are defined.

## 1. Runtime epochs and instruments

| Epoch | Meaning | Instrument sentinel |
|---|---|---|
| `legacy-cc-v5` | Frozen Claude-Code instrument (plan §2) | `legacy-cc-v5-1460441` (epoch + legacy baseline short hash) |
| `native-next-v1` | Native Cordis runtime (plan §2) | Derived from `RuntimeManifest` (plan §11.2); not yet produced |

Rules (enforced by `epoch-rules.mjs` and `test/epoch.test.mjs`):

1. Every canonical event and every artifact declares `epoch` and `instrumentVersion`.
2. A match cannot change epoch after admission: all events of one `matchId` share
   one epoch and one instrumentVersion.
3. Ranks and pools are epoch-scoped; a mixed-epoch stream is rejected by
   `assertEpochSeparation`.
4. The legacy importer is one-way and read-only; it emits canonical events under
   epoch `legacy-cc-v5` and never writes back into legacy artifacts.

## 2. ID discipline

IDs are never overloaded (plan §7):

| ID | Meaning | Format rule |
|---|---|---|
| `eventId` | One canonical event | UUID v4 |
| `rpcId` | Transport request/response correlation | opaque string, distinct from all domain IDs |
| `operationId` | One external effect attempt | opaque string; retries always receive a new ID |
| `tournamentId` | One assigned tournament | opaque string |
| `matchId` | One scientific match | opaque string; preserved from legacy on import |
| `sessionId` | One durable agent session | opaque string; `null` on legacy import (unobservable) |
| `activationId` | One execution epoch of a session | opaque string |
| `turnId` | One claimed FIFO turn | opaque string |
| `handoffId` | One typed causal transfer | opaque string |
| `artifactDigest` | Content address of raw bytes | `sha256:<64 lowercase hex>` |

On legacy import, session/activation/turn/handoff/operation identities are
**unobservable** and emitted as `null`; they are never inferred from stream
fields (plan §3 forbids legacy-style `subagent_type` inference).

## 3. Canonical event envelope (`civ.event/1`)

See `schemas/event.schema.json`. One line per canonical event, one event per
line. Every event carries `seq` (per-match monotonic), `eventId`, `ts`,
`matchId`, `epoch`, `instrumentVersion`, `type`, and `payloadDigest` (SHA-256 of
the canonical `payload` bytes). `artifactRefs` reference durable CAS bytes only;
an event can reference an artifact only after its CAS publication is durable
(plan §11.3). Legacy `payload_hash` is preserved inside the payload as
`legacyPayloadHash`; it is not the canonical digest.

### Canonical event types

| Canonical type | Legacy source | Notes |
|---|---|---|
| `match.admitted` | `match_start` | Carries design (regime/backend/command/task) and dispatch observability |
| `turn.observed` | `turn` | Model-visible output observation; `sessionId`/`turnId` null on legacy import |
| `operation.observed` | `tool` | Not present in the frozen legacy corpus; mapped for other corpora |
| `judge.observed` | `judge` | Not present in the frozen legacy corpus |
| `skill.event` | `skill` | Skill lifecycle observation (propose/commit) |
| `mechanism.triggered` | `veto_triggered`/`impeach_triggered`/`edict_triggered` | Payload carries `mechanism: veto\|impeach\|edict` |
| `match.terminal` | `match_end` | Payload carries exit code, signal, status, cumulative mechanism counts |
| `legacy.unmapped` | any other | Counted against the ≥99% mapping gate; a nonzero count is a hard-stop signal |

## 4. Mapping contract (legacy → canonical)

`packages/next/legacy-importer/map.mjs` implements the field map. Rules:

1. Every legacy event with a known type maps to exactly one canonical event.
2. Every observable legacy field is carried into the canonical payload or
   envelope. Fields outside the known set count as `unmappedUnknownField` and
   reduce the field mapping rate (gate: ≥99%).
3. Logical edges that the legacy instrument cannot observe — per-turn session
   identity, office handoffs, subagent type, internal plan authority — are
   labelled `unavailable` in the per-match edge report and are **never** counted
   in any handoff denominator (plan §17 P0).
4. `dispatch_plan` is carried as an **observed projection**
   (`payload.dispatch.observedOnly: true`), never as dispatch authority.

## 5. Artifact and manifest schema versions

| Artifact | Schema version |
|---|---|
| Canonical event | `civ.event/1` |
| Frozen corpus ledger | `corpus-v1` |
| Runtime manifest | `runtime-manifest/1` (plan §11.2) |
| RegimeIR | `regime-ir/1` (plan §8.1) |
| Feed protocol (P5) | `civ.feed/1`, `civ.describe/1` (plan §14.2) |

## 6. Contract freeze (P3 gate)

After the P3 SIGKILL fault matrix (600/600 trials), the versions in §5 are
**frozen**: any schema change is a compatibility project and a new
`instrumentVersion` semantic class (plan §2 invariant 9). The crash matrix
report schema is `crash-matrix/1`.

## 7. Executable tests

```bash
npm run test:next          # contracts + domain + runtime L0 suites
```
