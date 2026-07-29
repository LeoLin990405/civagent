# TASK-r5-trae: expand governance-scenarios.json 10 → 40

Status: PENDING
Priority: P1
Depends on: PR #29 merged (engine/prompts/governance-scenarios.json restored)

## Goal

Expand `engine/prompts/governance-scenarios.json` from 10 to 40 entries by
adding 30 new high-quality scenarios. The existing 10 must remain unchanged.

## Distribution

**Chinese-regime-inspired × 10** (one per topic; prompts stay generic — see
format rules):
Silk-Road-style trade route disruption, civil-examination reform dispute,
grain-transport system collapse, regional military separatism, court-faction
interference in government, river breach and disaster relief, frontier-market
and tributary crisis, state-monopoly corruption (salt/iron), military
aristocracy vs civil-official power struggle, ritual-law succession conflict.

**Global-general × 20**:
war-financing crisis, colonial independence movement, religious-institution
reform, abolition-transition instability, federal dissolution, currency
devaluation and inflation, inheritance-law gender dispute, border trade-city
autonomy, naval blockade and diplomatic pressure, industrialization shock to
handicrafts, grain-export ban pressures, refugee-influx policy, espionage
defection crisis, education-reform resistance, cross-province water conflict,
post-coup legitimacy reconstruction, debt default negotiation, cultural
assimilation resistance, urban poverty and class tension, post-disaster blame
attribution.

## Format rules (hard)

```json
{
  "id": "silk-road-01",
  "category": "economic",
  "prompt": "The primary overland trade route has been severed by a hostile coalition..."
}
```

- `id`: `<kebab-case-topic>-01`, lowercase, unique across the whole file
- `category`: one of `military` / `political` / `economic` / `social` /
  `crisis` / `diplomacy` / `internal` / `innovation`
- `prompt`: English, 60–150 words, **no specific dynasty/place/person names** —
  any of the 57 regimes must be able to respond in-character
- Final file: valid JSON array of exactly 40 objects (`node -e
  "JSON.parse(require('fs').readFileSync('engine/prompts/governance-scenarios.json'))"`)

## Acceptance

- `npm test` stays green (nothing imports the file's length yet, but JSON
  validity is exercised by the /api/scenarios endpoint test path)
- Reviewer (Codex) spot-checks 5 random prompts for the no-proper-nouns rule
