import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sendError } from '../http.mjs';
import { getRegimeSkillsStats } from '../services/skills.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Default regimes root is the repo's regimes/ tree (matches the layout the
// regimes router resolves to: <projectRoot>/regimes).
const DEFAULT_REGIMES_ROOT = path.resolve(__dirname, '../../regimes');

// Factory so tests can inject a temp regimes root holding fixture skills/ dirs.
export function createSkillsRouter({ regimesRoot = DEFAULT_REGIMES_ROOT } = {}) {
  const router = express.Router();

  // GET /api/skills/:region/:id/stats
  // Per-skill sedimentation stats for a regime. The aggregate fields
  // (total / uniqueTopics / duplicateGroups / stats) come straight from
  // engine/v5/skill-quality.mjs::analyzeSkillsDir(); skills[] carries per-file
  // provenance + filesystem metadata.
  router.get('/:region/:id/stats', (req, res) => {
    const { region, id } = req.params;
    const result = getRegimeSkillsStats(regimesRoot, region, id);
    if (!result.ok) return sendError(res, result.status, result.error);
    res.json(result.payload);
  });

  return router;
}

export default createSkillsRouter();
