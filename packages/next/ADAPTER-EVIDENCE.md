# Harness-Adapter Evidence — the single import boundary is real

**Pin:** `47f943859bef…` (`0.1.0-rc.5`, cordis `4.0.1`)
**Date:** 2026-08-14

This round closed the last structural gap in the plan's dependency rule
(§4.2): the `packages/next/harness-adapter` package exists, the import lint is
enforced, and the pinned seams are exercised **functionally** (not just
structurally) through their exports maps.

---

## 1. Import lint (P0/P1 gate, now enforced)

`packages/next/harness-adapter/import-lint.mjs` (`npm run lint:next-imports`)
scans every `.mjs/.js` under `packages/next/`:

| Rule | Status |
|---|---|
| Only `harness-adapter` may import `@deepseek-ai/*` | enforced; negative test (violation file) exits 1 |
| Imports use package exports only (root, `/surface`, `/presentation`, `/types`, `/client`, `/invariant`, `/message`, `/brand`, `/package.json`) | enforced; `/src/` and `/lib/` deep paths rejected |
| Only the 12 pinned seam package names | enforced |

Clean run: 7 `@deepseek-ai` imports, all inside the adapter, all exports-only.

## 2. Adapter facade (`adapter.mjs`)

- `adapterCapabilities()` — manifest-ready metadata: version, pin, seam list,
  pin-resolved flag, import policy.
- `loadSeams()` — lazy dynamic imports through the exports maps; clear error
  when the pin build is absent (module itself always loads); explicit pin
  override for tests.
- `link-pin.mjs` — creates the local `node_modules` symlink farm from the
  pinned build (12 seams).
- Facades translating external types at the edge: `createCordisContext()`
  (Cordis `Context` with `effect`/`on` lifecycle APIs), `createSurfaceManager()`
  (+ `foldSurface`), `deepseekAdapterSmoke()`.
- No CivAgent domain decision lives in the adapter (tested: no
  PolicyEngine/GraphDispatcher/Tournament/RegimeIR identifiers in the code).

## 3. Functional contract tests (real pinned seams, no network)

`packages/next/harness-adapter/test/adapter.test.mjs` — 8/8 pass:

- Capability metadata pin-bound and manifest-ready.
- Lazy loading: `loadSeams("/nonexistent-pin")` throws the boundary error;
  bogus `HARNESS_PIN_DIR` falls back to the verified local pin.
- **Real seams load**: `@deepseek-ai/cordis` `Context`, `dsh-session`
  `Session`, `dsh-session/surface` `SurfaceManager`, `dsh-llm-deepseek`
  `DeepSeekAdapter`, `dsh-agent-loop` `AgentLoop` all resolve and are
  functions.
- **Cordis Context constructs** with `effect`/`on` disposal APIs.
- **SurfaceManager boundary**: `foldSurface([])` → `{nodes: [], replacements:
  []}`; a foreign (our canonical) event shape is **rejected loudly, never
  mis-translated** — the surface envelope translation is flagged as the next
  boundary task (P6 adapter work).
- **DeepSeek engineering smoke**: the pinned `DeepSeekAdapter` constructs with
  a scripted config and resolves `deepseek-chat` (id + context window 65536 +
  default max tokens) through the seam's own code path with **zero network**
  (live lane requires credentials — P6).

## 4. Status vs plan

| Plan item | Status |
|---|---|
| P0: "Prototype dependency/import lint for the pinned Harness adapter" | ✅ `lint:next-imports`, negative tests |
| §4.2: only the adapter may depend on Harness/Cordis | ✅ enforced by lint over `packages/next/**` |
| §4.2: import only package exports, never internal paths | ✅ exports-only subpaths enforced |
| §4.2: translate external types at the boundary | ✅ facade functions; surface envelope translation flagged for P6 |
| §4.2: expose adapter capability/version metadata to the manifest | ✅ `adapterCapabilities()` |
| §4.2: contain no CivAgent tournament/topology/policy/judge decisions | ✅ tested |
| §4.2: contract tests before any Harness upgrade is admitted | ✅ 8 contract tests on the real pin; upgrades = compatibility projects |
| §17 P1: optional DeepSeek engineering smoke | ✅ adapter construction + model resolution, scripted config, no network |

## 5. Tests

`npm run test:next` — **84/84 pass** (10 contracts + 23 domain + 8 adapter + 11
host + 32 runtime). `npm run lint:next-imports` — PASSED. `npm run lint:backend`
— clean.

## 6. Next steps

- P6 live causal pilot: real adapters (doubao/glm/qwen/minimax) + credentials;
  the DeepSeek live lane behind `deepseekAdapterSmoke` once an API key is
  configured.
- Boundary translation of our canonical surface ↔ the Harness session surface
  envelope (SurfaceManager append/validateNext contract).
