# TASK-r5-antigravity: Tournament Launcher + Skill Library + orphan cleanup

Status: DONE (2026-07-30)
Priority: P0
Depends on: PR #29 merged (write API `POST /api/tournaments` is live)

> **Completion note**: TournamentLauncher + SkillLibrary tabs landed in
> `e1b2175` (`frontend/src/components/TournamentLauncher.tsx`,
> `SkillLibrary.tsx`); the four orphan components (`CodexBrowser`,
> `JudgeLeaderboard`, `RegimeBrowser`, `TerminalPanel`) retired and match
> history revived as the `MatchArchive.tsx` tab in `4e99a40` (−1226 lines).

## Context

The backend now has a full write path. The Express server (`server/`, port
**3001** — note: the old R4 task file said 4242, that was stale) exposes:

```
GET  /api/regimes                          57 regimes {id, metadata, identity, soul, skills}
GET  /api/regimes/:region/:id/identity     raw IDENTITY.md
GET  /api/regimes/:region/:id/topology     validated topology + graph metrics
GET  /api/matches                          match summaries (structured + legacy)
GET  /api/matches/:id                      meta + parsed events
GET  /api/matches/:id/stream               SSE live event stream
GET  /api/tournaments                      manifest list + judge result md
GET  /api/tournaments/:id                  single tournament
GET  /api/scenarios                        governance scenario prompt bank (10 entries)
GET  /api/stats/rankings                   cross-tournament BT rankings + CI
POST /api/tournaments                      {civs: string[]≤8, task: ≤2000 chars,
                                            backend?, noSkill?, judgesN? (1-3), anonCivs?}
                                           → 202 {tournamentId}, runs in background
```

`npm run dev` starts server (:3001) + vite (:5173, `/api` proxied).

The frontend shell is `frontend/src/App.tsx` — v6 glassmorphism, Sidebar tabs:
overview / regimes / analytics / memory / veto / live / rankings.

## Task 1: TournamentLauncher.tsx (new tab "Launch")

- Multi-select civs (≤6) loaded from `GET /api/regimes`
- Task input: free text OR "Random" button drawing from `GET /api/scenarios`
- Backend dropdown: `native` / `cn:doubao` / `cn:glm` (values must satisfy the
  server's backend whitelist `[A-Za-z0-9:._-]+`)
- Toggles: Multi-Judge (judgesN=2), Blind civs (anonCivs)
- Submit → `POST /api/tournaments` → on 202 switch to Live Court and follow the
  new tournament id; on 4xx/5xx show the server's `error` string inline
- Loading + error states mandatory

## Task 2: SkillLibrary.tsx (new tab "Skills")

- Left column: regime list (from `GET /api/regimes` — each regime object
  already carries its `skills` array: `{filename, content}`)
- Right column: selected regime's skills — filename, frontmatter `name:`,
  provenance banner fields if present
- Duplicate detection stats: the backend exposes them via
  `civagent skills <regime> --stats` (engine/v5/skill-quality.mjs
  `analyzeSkillsDir`); if you want them in the UI, request a
  `GET /api/skills/:region/:id/stats` endpoint from the backend party rather
  than reimplementing Jaccard in TS

## Task 3: Orphan component cleanup

Currently imported by nothing (verify before deleting):
- `CodexBrowser.tsx`, `HistoryExplorer.tsx`, `JudgeLeaderboard.tsx`,
  `TerminalPanel.tsx`, `RegimeBrowser.tsx` (superseded by RegimeBrowserV6)
- Either re-mount HistoryExplorer as a "Match Archive" tab wired to
  `GET /api/matches` (preferred — the data is there), or delete; delete the
  rest unless a tab needs them

## Constraints

- TypeScript strict, no `any` in new code (`npm run typecheck:frontend`,
  `npm run lint:frontend` — lint errors are blocking in CI)
- Do not modify server code; request endpoints from the backend party
- Existing React-Compiler-readiness warnings are known debt — do not add new ones

## Acceptance

`npm run dev` → select civs → Submit → watch the live transcript in Live Court
→ see the finished tournament in Rankings. No console errors.
`cd frontend && tsc -b && npm run lint` both clean.
