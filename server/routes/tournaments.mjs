import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { safeResolve, resolveFixedFile } from '../utils.mjs';

const rootDir = path.join(os.homedir(), '.civagent');

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

export default router;
