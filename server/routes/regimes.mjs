import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { safeResolve } from '../utils.mjs';
import { validateRegimeTopology } from '../../engine/topology/validate.mjs';
import { computeMetrics } from '../../engine/topology/metrics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const router = express.Router();

// /api/regimes
router.get('/', (req, res) => {
  const regimesDir = path.join(projectRoot, 'regimes');
  const result = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.startsWith('_') || file.startsWith('.')) continue;
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        if (fs.existsSync(path.join(fullPath, 'metadata.json'))) {
          try {
            const metadata = JSON.parse(fs.readFileSync(path.join(fullPath, 'metadata.json'), 'utf8'));
            const id = path.relative(regimesDir, fullPath);
            const identityPath = path.join(fullPath, 'IDENTITY.md');
            const identity = fs.existsSync(identityPath) ? fs.readFileSync(identityPath, 'utf8') : '';
            const soulPath = path.join(fullPath, 'SOUL.md');
            const soul = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, 'utf8') : '';
            const skillsDir = path.join(fullPath, 'skills');
            const skills = [];
            if (fs.existsSync(skillsDir)) {
              const skillFiles = fs.readdirSync(skillsDir).filter(f => f.endsWith('.md'));
              for (const sf of skillFiles) {
                skills.push({ filename: sf, content: fs.readFileSync(path.join(skillsDir, sf), 'utf8') });
              }
            }
            result.push({ id, metadata, identity, soul, skills });
          } catch (err) {
            console.error(`Error parsing regime in ${fullPath}:`, err);
          }
        } else {
          walk(fullPath);
        }
      }
    }
  };
  walk(regimesDir);
  res.json(result);
});

// /api/regimes/:region/:id/identity
router.get('/:region/:id/identity', (req, res) => {
  const { region, id } = req.params;
  const regimesDir = path.join(projectRoot, 'regimes');
  const resolved = safeResolve(regimesDir, region, id);
  if (!resolved.ok) return res.status(400).json({ error: resolved.error });
  const identityPath = path.join(resolved.resolved, 'IDENTITY.md');
  if (fs.existsSync(identityPath)) {
    try {
      res.json({ id, region, raw: fs.readFileSync(identityPath, 'utf8') });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.json({ id, region, raw: null });
  }
});

// /api/regimes/:region/:id/topology — reuse the engine's validator + metrics so
// the UI and the CLI always agree on what a valid topology is.
router.get('/:region/:id/topology', (req, res) => {
  const { region, id } = req.params;
  const regimesDir = path.join(projectRoot, 'regimes');
  const resolved = safeResolve(regimesDir, region, id);
  if (!resolved.ok) return res.status(400).json({ error: resolved.error });
  const topologyPath = path.join(resolved.resolved, 'topology.json');
  if (!fs.existsSync(topologyPath)) {
    return res.status(404).json({ error: `regime '${region}/${id}' has no topology.json` });
  }
  const v = validateRegimeTopology(resolved.resolved);
  if (!v.ok) {
    return res.status(422).json({ error: 'invalid topology.json', details: v.errors });
  }
  res.json({ id, region, topology: v.topology, metrics: computeMetrics(v.topology) });
});

// /api/regimes/:region/:id/mechanisms
router.get('/:region/:id/mechanisms', (req, res) => {
  const { region, id } = req.params;
  const regimesDir = path.join(projectRoot, 'regimes');
  const resolved = safeResolve(regimesDir, region, id);
  if (!resolved.ok) return res.status(400).json({ error: resolved.error });
  const metaPath = path.join(resolved.resolved, 'metadata.json');
  if (fs.existsSync(metaPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      res.json({ id, region, mechanisms: metadata.mechanisms || [] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(404).json({ error: 'Regime metadata not found' });
  }
});

export default router;
