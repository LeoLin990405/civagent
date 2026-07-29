import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { safeResolve, resolveFixedFile } from '../utils.mjs';
import { newTournamentId, TOURNAMENT_ID_RE } from '../../engine/v5/tournament.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOURNAMENT_MJS = path.resolve(__dirname, '../../engine/v5/tournament.mjs');

// Write-API limits (AGENTS.md invariant #6): validate hard, answer fast,
// run the tournament in a detached background process.
const MAX_CIVS = 8;
const MAX_TASK_CHARS = 2000;
const CIV_RE = /^(china|global)\/[a-z0-9][a-z0-9-]*(#[A-Za-z0-9:._-]+)?$/;
const BACKEND_RE = /^[A-Za-z0-9:._-]+$/;

// Factory so tests can inject a fake spawn and a temp state dir.
export function createTournamentsRouter({
  spawnFn = spawn,
  rootDir = path.join(os.homedir(), '.civagent'),
} = {}) {
  const router = express.Router();

  // /api/tournaments
  router.get('/', (req, res) => {
    const tournamentsDir = path.join(rootDir, 'tournaments');
    const list = [];
    if (fs.existsSync(tournamentsDir)) {
      const dirs = fs.readdirSync(tournamentsDir);
      for (const dir of dirs) {
        const manifestPath = path.join(tournamentsDir, dir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            let judgeResult = '';
            const resolvedDir = safeResolve(tournamentsDir, dir);
            if (resolvedDir.ok) {
              const resultPath = resolveFixedFile(resolvedDir.resolved, 'result.md');
              if (resultPath && fs.existsSync(resultPath)) judgeResult = fs.readFileSync(resultPath, 'utf8');
            }
            list.push({ id: dir, manifest, judgeResult });
          } catch { /* skip unreadable tournament dir */ }
        }
      }
    }
    res.json(list);
  });

  // POST /api/tournaments — launch a real tournament in the background.
  // Body: { civs: string[], task: string, backend?: string, noSkill?: boolean }
  // Answers 202 {tournamentId} immediately; progress is observable through the
  // usual read endpoints once the run writes its manifest/events.
  router.post('/', (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'JSON body required' });
    }
    const { civs, task, backend, noSkill, judgesN, anonCivs } = body;

    if (!Array.isArray(civs) || civs.length < 1 || civs.length > MAX_CIVS) {
      return res.status(400).json({ error: `civs must be an array of 1-${MAX_CIVS} regime ids` });
    }
    for (const c of civs) {
      if (typeof c !== 'string' || !CIV_RE.test(c)) {
        return res.status(400).json({ error: `invalid civ: ${JSON.stringify(c)} (expected region/regime-id[#backend])` });
      }
    }
    if (typeof task !== 'string' || !task.trim() || task.length > MAX_TASK_CHARS) {
      return res.status(400).json({ error: `task must be a non-empty string of at most ${MAX_TASK_CHARS} characters` });
    }
    if (backend != null && (typeof backend !== 'string' || !BACKEND_RE.test(backend))) {
      return res.status(400).json({ error: 'invalid backend id' });
    }
    if (judgesN != null && (!Number.isInteger(judgesN) || judgesN < 1 || judgesN > 3)) {
      return res.status(400).json({ error: 'judgesN must be an integer between 1 and 3' });
    }

    // A shared backend applies to civs that don't pin one with #backend.
    const civList = civs.map((c) => (backend && !c.includes('#') ? `${c}#${backend}` : c));

    const id = newTournamentId();
    if (!TOURNAMENT_ID_RE.test(id)) {
      return res.status(500).json({ error: 'generated tournament id failed validation' });
    }

    // Launch log lives outside the tournament dir (the engine owns that dir and
    // creates it itself); it captures spawn-time failures for debugging.
    const logsDir = path.join(rootDir, 'server-logs');
    fs.mkdirSync(logsDir, { recursive: true });
    const out = fs.openSync(path.join(logsDir, `${id}.launch.log`), 'a');

    const args = [TOURNAMENT_MJS, '--civs', civList.join(','), '--id', id];
    if (noSkill === true) args.push('--no-skill');
    if (judgesN != null && judgesN > 1) args.push('--judges', String(judgesN));
    if (anonCivs === true) args.push('--anon-civs');
    args.push(task.trim());

    try {
      const child = spawnFn(process.execPath, args, {
        detached: true,
        stdio: ['ignore', out, out],
      });
      child.unref?.();
    } catch (err) {
      fs.closeSync(out);
      return res.status(500).json({ error: `failed to launch tournament: ${err.message}` });
    }
    fs.closeSync(out);

    res.status(202).json({ tournamentId: id });
  });

  // /api/tournaments/:id
  router.get('/:id', (req, res) => {
    const id = req.params.id;
    const resolved = safeResolve(rootDir, 'tournaments', id);
    if (!resolved.ok) return res.status(400).json({ error: resolved.error });
    const manifestPath = path.join(resolved.resolved, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        let judgeResult = '';
        const resultPath = resolveFixedFile(resolved.resolved, 'result.md');
        if (resultPath && fs.existsSync(resultPath)) judgeResult = fs.readFileSync(resultPath, 'utf8');
        res.json({ id, manifest, judgeResult });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.status(404).json({ error: 'Tournament not found' });
    }
  });

  return router;
}

export default createTournamentsRouter();
