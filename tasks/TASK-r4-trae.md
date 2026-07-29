> **SUPERSEDED (2026-07-29)** — historical record of R4. Current tasks: tasks/TASK-r5-*.md. Note: the API server listens on port 3001, not 4242.

# TASK-r4-trae — Governance Scenario Bank Expansion

**Assigned to**: Trae (MiMo model)  
**Project**: ~/Projects/civagent  
**File to edit**: `engine/prompts/governance-scenarios.json`  
**Priority**: P1 (independent, can run in parallel)

---

## Context

CivAgent v5 runs governance simulations where 57 historical civilizations (Tang Dynasty, Roman Republic, Soviet Union, Venetian Republic, etc.) respond to governance challenges. The `governance-scenarios.json` file is a prompt bank used by `civagent tournament --prompt-bank` to randomly select a scenario.

Currently the file has **10 scenarios**. Your task is to expand it to **40 scenarios** by adding 30 new high-quality entries.

---

## Current file structure

```json
[
  {
    "id": "frontier-defense-01",
    "category": "military",
    "prompt": "Establish secure and robust border defense policies for agricultural frontiers facing seasonal tribal raids."
  },
  ...
]
```

The full current 10 entries cover: frontier defense, succession crisis, economic collapse, external threat, internal revolt, technological disruption, plague response, trade route disruption, famine relief, religious schism.

---

## Requirements for new scenarios

### Format (identical to existing entries)

```json
{
  "id": "kebab-case-topic-01",
  "category": "one of the enum values below",
  "prompt": "English text, 60–150 words, universally applicable"
}
```

### Category enum (use exactly these values)

`military` · `political` · `economic` · `social` · `crisis` · `diplomacy` · `internal` · `innovation`

### ID naming rules

- Lowercase, hyphen-separated
- End with `-01` (two-digit suffix)
- Must be unique from all existing IDs
- Good examples: `silk-road-01`, `succession-regency-01`, `tax-reform-01`

### Prompt writing rules — CRITICAL

1. **Universal**: ANY governance system (autocracy, democracy, theocracy, federation) must be able to respond meaningfully to it. Do NOT mention specific dynasties, countries, rulers, or locations.
2. **Specific challenge**: Not vague. Must describe a concrete problem that requires the governance system to make real decisions.
3. **Open-ended**: No implied "correct" answer. Tang Dynasty and Roman Republic should produce very different but both-valid responses.
4. **Length**: 60–150 words in English. Write complete sentences.
5. **Present tense** framing preferred ("The treasury faces..." not "Imagine the treasury faced...")

### Bad prompt examples (avoid these patterns)
- ❌ Too vague: "Manage a conflict in your territory."
- ❌ Historically specific: "The Yuan Dynasty has invaded from the north..."
- ❌ Has implied answer: "Design a democratic response to the crisis..."
- ❌ Too short: "A famine has struck. What do you do?"

### Good prompt example
> "A significant portion of the state's revenue has been collected by regional tax farmers who now refuse to remit funds to the centre, citing local grievances. Military intervention risks disrupting commerce and alienating local elites. Design a fiscal recovery strategy that restores revenue flow while managing political risk."

---

## The 30 new scenarios to write

Write exactly one scenario per topic below. Use the suggested `id` and `category`, but write your own `prompt`.

### Chinese-governance-specialized (10 scenarios)

| # | suggested id | category | Core challenge to dramatize |
|---|---|---|---|
| 1 | `silk-road-01` | `economic` | Primary overland trade route severed; silk and spice revenues collapse; merchants petition for military escort vs. maritime pivot |
| 2 | `exam-reform-01` | `political` | Central examination system produces too many graduates but not enough competent administrators; regional nobles push to restore hereditary appointment |
| 3 | `canal-collapse-01` | `crisis` | Main grain transport waterway has silted up or breached; northern capital risks starvation; emergency repair vs. alternative logistics |
| 4 | `warlord-fragmentation-01` | `internal` | Multiple regional military governors have stopped sending tax revenue and are raising private armies; center cannot afford to suppress all simultaneously |
| 5 | `court-faction-01` | `political` | Two rival court factions (one backed by palace officials, one by outer bureaucracy) are paralysing policy decisions; each blocks the other's proposals |
| 6 | `river-flood-01` | `crisis` | Major river has breached levees across three provinces; hundreds of thousands displaced; granary reserves insufficient for full relief |
| 7 | `tribute-collapse-01` | `diplomacy` | Several tributary states have stopped sending tribute and are negotiating with a rival power; direct military enforcement risks overextension |
| 8 | `salt-monopoly-01` | `economic` | State salt monopoly revenues have collapsed due to widespread smuggling; enforcement crackdowns are causing merchant revolts in coastal provinces |
| 9 | `civil-military-rivalry-01` | `political` | Military campaign victories have made a general politically powerful enough to challenge civilian governance; demobilizing him risks a coup; keeping him risks future usurpation |
| 10 | `regency-legitimacy-01` | `political` | The head of state is incapacitated (illness, minority, captivity); a regent governs but lacks full legal authority; rival claimants are mobilizing support |

### Universal / cross-civilization (20 scenarios)

| # | suggested id | category | Core challenge |
|---|---|---|---|
| 11 | `war-financing-01` | `economic` | Extended military campaign has exhausted treasury; options are currency debasement, forced loans from merchants, or new taxes on landowners |
| 12 | `colonial-revolt-01` | `internal` | A distant province with significant economic value is demanding autonomy after decades of extractive governance; suppress, negotiate, or release? |
| 13 | `religious-reform-01` | `social` | State-sanctioned religious institution is demanding veto power over secular policy; reformers want to curtail clerical privileges; both factions have popular followings |
| 14 | `coerced-labor-transition-01` | `social` | Forced labor system (serfdom, slavery, corvée) is facing organized resistance and international condemnation; economic dependents resist abolition; design a transition plan |
| 15 | `federation-breakup-01` | `political` | Two powerful member states of a federated polity are threatening to secede over a constitutional dispute; binding arbitration has failed |
| 16 | `currency-crisis-01` | `economic` | Rapid currency debasement has triggered hoarding and barter; foreign creditors demand hard currency repayment; domestic merchants refuse debased coins |
| 17 | `succession-gender-01` | `political` | The legal heir to the state's leadership is of a gender or lineage that traditional law does not recognize as eligible; powerful factions back competing claimants |
| 18 | `border-city-autonomy-01` | `political` | A prosperous border trading city is demanding self-governance and threatening to invite a rival power as protector if refused; the city controls key transit revenues |
| 19 | `naval-blockade-01` | `diplomacy` | A hostile maritime power has blockaded major ports; import prices are rising; export merchants are losing contracts; military relief is months away |
| 20 | `industrial-displacement-01` | `economic` | New production methods are displacing skilled artisan guilds; guild associations are petitioning for protective legislation; industrialists lobby for free competition |
| 21 | `grain-export-ban-01` | `diplomacy` | Domestic harvest shortfall forces a choice between feeding citizens (ban exports) and honoring trade treaties that guarantee grain supply to allied states |
| 22 | `refugee-crisis-01` | `social` | Mass displacement from a neighboring conflict has sent hundreds of thousands across the border; integration strains local food, housing, and employment |
| 23 | `intelligence-defection-01` | `internal` | A senior intelligence official has defected to a rival power, compromising existing spy networks; counter-intelligence reform collides with agency turf battles |
| 24 | `education-overhaul-01` | `innovation` | The existing educational curriculum no longer produces graduates with skills the economy requires; reformers want rapid restructuring; traditionalists cite cultural continuity |
| 25 | `water-rights-dispute-01` | `internal` | Upstream and downstream provinces are in conflict over water allocation from a shared river system; agricultural production in both regions is at risk |
| 26 | `coup-aftermath-01` | `political` | A military faction has deposed the previous leadership. The new ruling council must establish legal legitimacy, prevent counter-coups, and restore civil administration |
| 27 | `sovereign-debt-01` | `economic` | The state cannot service its foreign debt. Creditor nations threaten to seize customs revenues. Domestic austerity risks popular unrest. Design a debt resolution strategy |
| 28 | `assimilation-resistance-01` | `social` | A recently incorporated minority population is resisting cultural and linguistic standardization policies; resistance has turned into low-level insurgency |
| 29 | `urban-inequality-01` | `social` | Rapid urbanization has created vast slums surrounding the capital; crime, disease, and political radicalism are rising; elites resist redistribution |
| 30 | `disaster-blame-01` | `crisis` | A major preventable disaster (structural collapse, epidemic, fire) has killed thousands. Multiple institutions share responsibility. Design accountability mechanisms without paralysing governance |

---

## Output

Overwrite `engine/prompts/governance-scenarios.json` with the full 40-entry array (existing 10 + your 30 new ones). The JSON must be valid — run `JSON.parse` mentally on your output before finishing.

Maintain alphabetical order by `id` is not required; appending the 30 new entries after the existing 10 is fine.

---

## Verification

After writing the file, confirm:
- `jq length engine/prompts/governance-scenarios.json` → 40
- `jq '[.[].category] | unique' engine/prompts/governance-scenarios.json` → only values from the allowed enum
- `jq '[.[].id] | unique | length' engine/prompts/governance-scenarios.json` → 40 (no duplicate ids)
- All `prompt` fields are English strings between 60 and 300 characters (the 150-word limit is a guideline, not hard cutoff)
