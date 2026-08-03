import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { safeResolve } from '../utils.mjs';
import { sendError } from '../http.mjs';
import { listRegimes, listRegimeSummaries } from '../services/regimes.mjs';
import { updateRegimeFiles } from '../services/regime-write.mjs';
import { validateRegimeTopology } from '../../engine/topology/validate.mjs';
import { computeMetrics } from '../../engine/topology/metrics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROJECT_ROOT = path.resolve(__dirname, '../..');

// Factory so tests can inject a temp project root holding fixture regimes/.
// projectRoot is the parent of the `regimes/` directory (matches the repo layout).
export function createRegimesRouter({ projectRoot = DEFAULT_PROJECT_ROOT } = {}) {
  const router = express.Router();
  const regimesDir = path.join(projectRoot, 'regimes');

  // /api/regimes — full catalog by default. Pass ?summary=1 for a lightweight
  // listing that omits the IDENTITY/SOUL/skills bodies (the bodies are only
  // needed when the client drills into a regime, not for the catalog view).
  // Without ?summary=1 the payload is byte-identical to the legacy handler.
  router.get('/', (req, res) => {
    try {
      if (req.query.summary === '1') {
        return res.json(listRegimeSummaries(regimesDir));
      }
      res.json(listRegimes(regimesDir));
    } catch (err) {
      sendError(res, 500, err.message);
    }
  });

  // PUT /api/regimes/:region/:id — edit metadata.json / IDENTITY.md / SOUL.md.
  // Edits only (no create/delete). The full pre-commit validation chain runs in
  // the service against the proposed content; on any failure nothing is written
  // and a structured findings list comes back. 200 returns the re-compiled
  // summary; 400 = validation failure; 404 = regime not found.
  router.put('/:region/:id', (req, res) => {
    const { region, id } = req.params;
    const result = updateRegimeFiles(regimesDir, region, id, req.body);
    if (!result.ok) {
      return res.status(result.status).json({ error: 'regime update rejected', findings: result.findings });
    }
    res.json(result.summary);
  });

  // /api/regimes/:region/:id/identity
  router.get('/:region/:id/identity', (req, res) => {
    const { region, id } = req.params;
    const resolved = safeResolve(regimesDir, region, id);
    if (!resolved.ok) return sendError(res, 400, resolved.error);
    const identityPath = path.join(resolved.resolved, 'IDENTITY.md');
    if (fs.existsSync(identityPath)) {
      try {
        res.json({ id, region, raw: fs.readFileSync(identityPath, 'utf8') });
      } catch (err) {
        sendError(res, 500, err.message);
      }
    } else {
      res.json({ id, region, raw: null });
    }
  });

  // /api/regimes/:region/:id/topology — reuse the engine's validator + metrics so
  // the UI and the CLI always agree on what a valid topology is.
  router.get('/:region/:id/topology', (req, res) => {
    const { region, id } = req.params;
    const resolved = safeResolve(regimesDir, region, id);
    if (!resolved.ok) return sendError(res, 400, resolved.error);
    const topologyPath = path.join(resolved.resolved, 'topology.json');
    if (!fs.existsSync(topologyPath)) {
      return sendError(res, 404, `regime '${region}/${id}' has no topology.json`);
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
    const resolved = safeResolve(regimesDir, region, id);
    if (!resolved.ok) return sendError(res, 400, resolved.error);
    const metaPath = path.join(resolved.resolved, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        res.json({ id, region, mechanisms: metadata.mechanisms || [] });
      } catch (err) {
        sendError(res, 500, err.message);
      }
    } else {
      sendError(res, 404, 'Regime metadata not found');
    }
  });

  return router;
}

export default createRegimesRouter();
