# TASK-r4-antigravity — R4 Frontend

**Assigned to**: antigravity  
**Project**: ~/Projects/civagent  
**Branch**: create `feat/r4-frontend` from current `main`  
**Priority**: P1 (can start in parallel with backend write API)

---

## Context

CivAgent v5 is a 57-civilization governance simulator that runs on Claude Code. The frontend (Vite + React + TypeScript) currently has a full Dashboard UI but runs **sandbox simulated data**. The backend is adding a local HTTP API server (port 4242) that exposes real match data and lets the frontend launch tournaments.

Your job in R4: connect the frontend to real data, add a tournament launcher, and add a skill library viewer.

**API server runs at `http://localhost:4242`**. Configure vite.config to proxy `/api` there. If the server is not running, gracefully fall back to DEMO sandbox mode.

---

## Existing frontend structure (main branch)

```
frontend/
  src/
    App.tsx                      ← main shell, tab routing, state
    types/api.ts                 ← shared TypeScript types
    components/
      TerminalPanel.tsx          ← per-civ transcript view
      JudgeLeaderboard.tsx       ← tournament results table
      HistoryExplorer.tsx        ← past match history
      RegimeBrowser.tsx          ← regime list (reads local JSON)
      CodexBrowser.tsx           ← regime browser by orchestration pattern
      regime/
        OrgChart.tsx
        ModeComparison.tsx
        RelationshipNetwork.tsx
  vite.config.ts                 ← currently proxies /api to localhost (check port)
```

**Do not break**: CodexBrowser, RegimeBrowser, and the existing regime/OrgChart visualizations. These are working and used.

---

## Task 1 — Proxy & real-data toggle

### vite.config.ts
Ensure `/api` is proxied to `http://localhost:4242`. Current vite.config may already have this — verify the port matches.

### App.tsx — data source detection

At mount, call `GET /api/regimes`. If it succeeds → real mode. If it fails (server not running) → DEMO mode.

```typescript
// Real mode: pull from API
// Demo mode: use existing SIMULATION_CIVS / SIMULATION_LOGS constants

const [isRealMode, setIsRealMode] = useState(false);
```

In DEMO mode, show a `"⚡ DEMO MODE — start server to use real data"` badge in the header. In real mode, hide it.

---

## Task 2 — TournamentLauncher component

**File**: `frontend/src/components/TournamentLauncher.tsx`

### Behaviour

1. Load `GET /api/regimes` → populate civ selector
2. Load `GET /api/scenarios` → populate scenario picker
3. User selects:
   - **Civs** (multi-select checkboxes, min 2, max 6)
   - **Task** (textarea, OR "Random" button → picks a random scenario from /api/scenarios)
   - **Backend** (dropdown: `native` | `cn:doubao` | `cn:glm`)
   - **Multi-Judge** (toggle, off by default)
4. Submit → `POST /api/tournament` with body:
   ```json
   {
     "civs": ["china/tang", "global/roman-republic"],
     "task": "Handle a grain shortage in the eastern provinces",
     "backend": "native",
     "multiJudge": false
   }
   ```
5. On success → store `tournamentId`, navigate to Dashboard tab, start polling

### Error states
- Server down → show "API server not running. Start with `npm run serve`."
- Fewer than 2 civs selected → inline validation, no submit
- POST fails → show error message, don't navigate away

### Types to add in `types/api.ts`
```typescript
export interface TournamentRequest {
  civs: string[];
  task: string;
  backend?: string;
  multiJudge?: boolean;
  judgesN?: number;
}

export interface TournamentResponse {
  tournamentId: string;
}

export interface Scenario {
  id: string;
  category: string;
  prompt: string;
}
```

---

## Task 3 — Live event streaming in TerminalPanel

**Current state**: TerminalPanel receives `events: MatchEvent[]` as a prop and renders them statically.

**Change**: When a `matchId` is provided AND the match is not yet completed, poll `GET /api/matches/:matchId/events` every 1.5 seconds.

```typescript
// Props addition
interface TerminalPanelProps {
  // existing props...
  matchId?: string;   // if provided, poll for live updates
  liveMode?: boolean; // true while match is running
}
```

Polling logic:
```
every 1.5s: GET /api/matches/:matchId/events
  → compare seq numbers
  → append only events with seq > lastSeq
  → if any event has type === "match_end": stop polling, set liveMode=false
  → if any event has type === "skill": show SkillBadge below transcript
```

SkillBadge examples:
- `status: "saved"` → `✅ Skill saved: <skillPath basename>`
- `status: "skipped"` → `⏭ Skill skipped: <reason>`
- `status: "rejected"` → `⚠️ Skill rejected: <reason>`
- `status: "error"` → `❌ Skill error: <reason>`

---

## Task 4 — Skill Library tab

**File**: `frontend/src/components/SkillLibrary.tsx`

### Layout
Two-column layout: regime list (left, 240px wide) | skill list (right).

### Data

Left column: regime list from `GET /api/regimes`, sorted alphabetically.

Right column: on regime click, load `GET /api/skills/:regimeId` which returns:
```typescript
interface SkillLibraryResponse {
  regime: string;
  skills: SkillEntry[];
  stats: {
    total: number;
    unique: number;
    duplicateGroups: number;
    firstSedimented: string | null;
    lastSedimented: string | null;
  };
}

interface SkillEntry {
  filename: string;
  name: string;          // from frontmatter `name:` field
  savedAt: string;       // ISO timestamp from filename or mtime
  sizeBytes: number;
  isDuplicate: boolean;  // true if flagged by skill-quality
  duplicateOf?: string;  // filename of the canonical version
}
```

### UI details
- Top of right column: stats badge (`📚 12 skills · 10 unique · 2 duplicate groups`)
- Each skill row: filename | name | date | size | [⚠️ Duplicate] badge if applicable
- Empty state: "No skills yet for this regime. Run a match to start learning."
- Loading + error states required

---

## Task 5 — Wire everything into App.tsx tabs

Add two new tabs to the existing tab bar:
- **"Launch"** → `TournamentLauncher`
- **"Skills"** → `SkillLibrary`

Existing tabs (`Dashboard`, `History`, `Regimes`, `Codex`) stay unchanged.

When a tournament is launched from the Launch tab:
1. Store the `tournamentId` in `App` state
2. Switch to the `Dashboard` tab
3. Pass `matchId` values (from tournament manifest) to each `TerminalPanel` → activate live polling

---

## Constraints

- **TypeScript strict** — no `any` in new code. Use proper types everywhere.
- **Error boundaries** — every new component must handle loading, error, and empty states.
- **No UI framework additions** — stay within existing Tailwind + lucide-react setup.
- **Don't touch** CodexBrowser / RegimeBrowser / regime/ internals.
- **DEMO mode** must still work completely when server is offline.

---

## Acceptance criteria

1. `npm run dev:all` (frontend + API server) starts cleanly
2. Real mode: launch a 2-civ tournament from UI → Dashboard shows live transcript → JudgeLeaderboard shows final scores
3. DEMO mode (server off): existing simulated tournament still plays, "⚡ DEMO MODE" badge visible
4. Skill Library tab: at least shows regime list + empty state per regime
5. No TypeScript errors (`tsc --noEmit`)
6. No console errors in browser during normal flow

---

## Notes

- The write API (`POST /api/tournament`) is async — it returns immediately with `tournamentId`. The civs' `matchId` values come from the tournament manifest at `GET /api/tournaments/:tournamentId/manifest`. Poll the manifest until `civs` array is populated, then start polling each civ's events.
- If polling manifest fails for 30s, show error "Tournament failed to start."
- The `POST /api/tournament` request body field `civs` is an array of `region/regime-id` strings (e.g., `"china/tang"`), exactly matching the ids from `GET /api/regimes`.
