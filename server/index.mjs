import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb } from './db/database.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENARIOS_PATH = path.resolve(__dirname, '../engine/prompts/governance-scenarios.json');

import regimesRoutes from './routes/regimes.mjs';
import tournamentsRoutes from './routes/tournaments.mjs';
import matchesRoutes from './routes/matches.mjs';
import historyRoutes from './routes/history.mjs';
import analyticsRoutes from './routes/analytics.mjs';
import statsRoutes from './routes/stats.mjs';
import skillsRoutes from './routes/skills.mjs';

// Build the Express app. Exported (without listening) so tests can mount it on an
// ephemeral port; the listen() only runs when this file is executed directly.
export function createApp() {
  // Initialize the SQLite database connection (read-only; no-op if absent)
  initDb();

  const app = express();
  app.use(cors());
  // Cap request bodies — these endpoints take only small JSON payloads.
  app.use(express.json({ limit: '64kb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      version: '6.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      }
    });
  });

  // Governance scenario library (prompt bank for the tournament launcher)
  app.get('/api/scenarios', (req, res) => {
    try {
      res.json(JSON.parse(fs.readFileSync(SCENARIOS_PATH, 'utf8')));
    } catch (err) {
      res.status(500).json({ error: `cannot read scenario library: ${err.message}` });
    }
  });

  // Register modularized routes
  app.use('/api/regimes', regimesRoutes);
  app.use('/api/tournaments', tournamentsRoutes);
  app.use('/api/matches', matchesRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/skills', skillsRoutes);

  // Global error handler — prevents unhandled rejections from crashing the server.
  // The 4-arg signature (incl. _next) is what marks this as Express error middleware.
  app.use((err, req, res, _next) => {
    console.error(`[Server Error] ${req.method} ${req.url}:`, err.message);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      path: req.url,
    });
  });

  return app;
}

// Only start listening when run directly (not when imported by a test).
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 3001;
  createApp().listen(PORT, () => {
    console.log(`CivAgent V6 Backend Server listening on port ${PORT}`);
  });
}
