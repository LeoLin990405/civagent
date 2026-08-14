# Live-Lane Evidence — direct HTTP adapter + async gateway

**Epoch:** `native-next-v1` · **Date:** 2026-08-14

This round delivered the last missing machinery of the live lane (plan §12,
§13.1): a real direct HTTP provider adapter behind the ModelGateway contract,
with SecretBroker credential enforcement and a full scripted-HTTP wire test —
plus a necessary architecture fix discovered by it.

---

## 1. Architecture fix: ModelGateway is now async

`ModelGateway.request` was synchronous and called `provider.send(request)`
directly — correct for the scripted fake provider, **wrong for any real
adapter** (HTTP is inherently async): `send` returned a promise whose `.kind`
was `undefined` and the gateway threw. The gateway is now `async` and awaits
the transport. All callers were migrated:

- `runtime/slice.mjs` (vertical slice + crash classifications),
- `runtime/p2-slice.mjs` (office turns, handoffs, walk recursion — the
  unawaited `walk(edge.target)` recursion was also fixed: it floated after
  `store.close` and truncated office participation),
- `runtime/p4-slice.mjs`, `runtime/p6-pilot.mjs`, and every test call site.

This is the plan's provider-is-generation contract made honest: a real adapter
streams; the gateway's start-intent-before-transport ordering holds across the
await boundary (tested).

## 2. DirectHttpAdapter (`providers/http-adapter.mjs`)

- **Origin-bound**: closed registry `{deepseek: api.deepseek.com, ark:
  ark.cn-beijing.volces.com}`; any other origin → `OriginDeniedError` before
  construction (tested).
- **Credentials via SecretBroker** (plan §13.1): `CredentialRef` resolved only
  for the admitted operation and target origin; unknown ref / unknown origin
  rejected; `redact()` for evidence logging without secret contents (tested).
- **Transport**: `POST {baseURL}/chat/completions` with `stream: true` +
  `stream_options.include_usage`; SSE parsed; chunks streamed out; usage from
  the tail chunk; tool-call deltas carried; `[DONE]` terminates.
- **Fail closed**: 429 → `rate_limit`, 5xx → `server_error`, network → 
  `transport`, malformed SSE frame → `malformed_frame`, empty stream →
  `eof_early`. No retry (retryPolicy none). Missing usage never fabricated.
- Injectable transport (`fetchImpl`) keeps tests hermetic (L2: real local
  boundary, fake HTTP — plan §18.2).

## 3. Scripted-HTTP contract tests (4/4)

`packages/next/runtime/test/http-adapter.test.mjs` runs the full wire path
against an in-process scripted provider server:

| Test | Result |
|---|---|
| Full wire path | ✅ exactly one authenticated HTTP request (`Bearer sk-test-123`), start intent event precedes the first raw chunk in the committed log, chunks captured to CAS, usage {11, 7} parsed, canonical response, all events validate |
| Malformed SSE | ✅ fail closed, no response fabricated |
| Empty stream | ✅ `eof_early`, never a fake response |
| SecretBroker | ✅ origin binding, unknown refs, redaction, registry closure |

## 4. Status vs plan

| Plan item | Status |
|---|---|
| §12.1 provider is generation, not orchestration | ✅ adapter sends/streams/reports only; gateway owns ordering |
| §12.1 fail closed on missing capability/usage | ✅ malformed/empty/error mapping; usage never fabricated |
| §13.1 origin-bound HTTPS + CredentialRef via SecretBroker | ✅ registry + broker enforced and tested |
| §13.1 no ambient credentials | ✅ key injected per operation from the broker |
| Live lane | **Ready**: insert a real key into the broker and the adapter talks to api.deepseek.com / ARK; network egress verified (401 at both origins) |

## 5. Tests

`npm run test:next` — **94/94 pass** (90 previous + 4 HTTP adapter). Both lints
clean.

## 6. Next steps

- Live smoke: broker with a real DeepSeek/ARK key, one budgeted call through
  the vertical slice.
- Browser research GUI (P5 remainder) on the feed/client contracts.
