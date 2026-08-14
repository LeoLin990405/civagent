# @civagent harness-adapter — the only Harness import boundary

Plan §4.2: only this package may depend on `@deepseek-ai/*` or Cordis.

- **Pinned**: seam versions resolved from Harness commit `47f943859bef…` (`0.1.0-rc.5`,
  cordis `4.0.1`). Upgrades are deliberate compatibility projects.
- **Exports only**: `import-lint.mjs` (`npm run lint:next-imports`) enforces that
  every `@deepseek-ai/*` import in `packages/next/**` lives in this package and
  uses only package-export subpaths (`/surface`, `/presentation`, `/types`,
  `/client`, `/invariant`, `/message`, `/brand`, `/package.json`). Never `/src/`,
  never `/lib/` deep paths, never a fork.
- **Boundary translation**: external types are converted into
  `@civagent/contracts` types at the facade (`adapter.mjs`) — no CivAgent
  tournament/topology/policy/judge decision lives here (tested).
- **Resolution**: seams load lazily from a pinned build
  (`HARNESS_PIN_DIR` or the verified `/tmp/dsh-pin`); `link-pin.mjs` creates the
  local `node_modules` symlink farm. `loadSeams()` throws a clear error when the
  pin is absent; contract tests skip gracefully.
- **Capability metadata**: `adapterCapabilities()` feeds the RuntimeManifest
  (plan §11.2).

## Usage

```bash
npm run lint:next-imports      # dependency gate
node packages/next/harness-adapter/link-pin.mjs   # after building the pin
npm run test:next              # includes adapter contract tests
```

## Seams

cordis · dsh-llm · dsh-llm-deepseek · dsh-agent · dsh-agent-loop · dsh-session
(+ /surface) · dsh-system-prompt · dsh-tools · dsh-credentials ·
dsh-typert-protocol · dsh-typert-registry · dsh-client-connection
