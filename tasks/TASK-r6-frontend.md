# TASK-r6-frontend: online regime editor + skill staging UI

Status: PENDING
Priority: P0
Owner: Antigravity
Depends on: R6-1 (regime write API) and R6-4 backend (skill-management API) on the integration branch

## Context

R5 shipped the TournamentLauncher and SkillLibrary tabs. R6 completes the
management console: edit a regime in the browser, watch it validate, manage
staged skills. Read `AGENTS.md` first — frontend gates are `npm run
build:frontend` (tsc + bundle) and `npm run lint:frontend` with 0 errors;
TypeScript strict, no new `any`; contracts live in `frontend/src/types/api.ts`.

## §1 Online regime editor (R6-3)

New "Editor" tab in the sidebar (`frontend/src/components/layout/Sidebar.tsx`),
new component (suggested `frontend/src/components/RegimeEditor.tsx`):

- Metadata form: `name.zh/en`, `era.zh/en`, `system.zh/en`, `description.zh/en`,
  tags. Bilingual fields stay bilingual (AGENTS.md rule 8).
- IDENTITY.md agent-table editor: structured rows (Agent ID / name / role /
  description). The editor **must emit exactly the markdown table format
  `parseIdentityTable` accepts** — never freeform prose (AGENTS.md rule 2:
  prose parses to 0 agents). Show the compiled agent count live.
- SOUL.md textarea.
- Save → `PUT /api/regimes/:region/:id` (R6-1); render server validation errors
  per field; on success, refresh from the existing regime endpoint and show
  the recompiled agent preview.
- Guardrails: unsaved-changes warning; edits of `topology.json` are out of
  scope (read-only display only).

## §2 Skill staging UI (R6-4 frontend)

Extend `frontend/src/components/SkillLibrary.tsx`:

- "Staged" section listing `GET /api/skills/staged` entries per regime.
- Approve button → `POST /api/skills/:region/:id/approve`; rejection removes
  the entry from the UI (delete endpoint is out of scope this round —
  rejection is local/informational unless the backend lands a delete route).
- Keep the existing stats view (Batch-2 `GET /api/skills/:region/:id/stats`).

## Acceptance

```bash
npm run build:frontend    # tsc -b + vite build — must pass
npm run lint:frontend     # 0 errors (compiler-readiness warnings may stay)
```

Plus a demonstrated round-trip against the dev server (`npm run dev`): edit a
regime → server validation → saved → compiled agents preview updated.

## Output

Leave a completion note (components added, screenshots path if any) at the
bottom of this file.
