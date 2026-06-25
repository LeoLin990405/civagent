import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(os.homedir(), '.civagent');
const projectRoot = path.resolve(__dirname, '..');

const dbPath = path.join(rootDir, 'civagent_history.db');
let db = null;
try {
  if (fs.existsSync(dbPath)) {
    db = new Database(dbPath, { readonly: true });
  }
} catch (err) {
  console.error('Could not open history DB for reading:', err);
}

const app = express();
app.use(cors());
app.use(express.json());

const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

function safeResolve(root, ...segments) {
  for (const seg of segments) {
    if (seg === '.' || seg === '..') return { ok: false, error: `invalid segment "${seg}"` };
    if (seg.includes('/') || seg.includes('\\')) return { ok: false, error: `invalid segment "${seg}"` };
    if (!SAFE_ID.test(seg)) return { ok: false, error: `invalid segment "${seg}"` };
  }
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(path.join(root, ...segments));
  if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
    return { ok: false, error: 'path traversal' };
  }
  return { ok: true, resolved };
}

function resolveFixedFile(validatedDir, filename) {
  if (filename === '.' || filename === '..' || filename.includes('/') || filename.includes('\\')) return null;
  const resolvedDir = path.resolve(validatedDir);
  const resolved = path.resolve(path.join(validatedDir, filename));
  if (resolved !== resolvedDir && !resolved.startsWith(resolvedDir + path.sep)) return null;
  return resolved;
}

function parseEventsJsonl(raw) {
  const events = [];
  const lines = raw.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      // skip bad lines
    }
  }
  return events;
}

// /api/regimes
app.get('/api/regimes', (req, res) => {
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
app.get('/api/regimes/:region/:id/identity', (req, res) => {
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

// /api/tournaments
app.get('/api/tournaments', (req, res) => {
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
        } catch (err) {}
      }
    }
  }
  res.json(list);
});

// /api/tournaments/:id
app.get('/api/tournaments/:id', (req, res) => {
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

// /api/matches
app.get('/api/matches', (req, res) => {
  const transcriptsDir = path.join(rootDir, 'transcripts');
  const matchesDir = path.join(rootDir, 'matches');
  const list = [];
  if (fs.existsSync(matchesDir)) {
    const dirs = fs.readdirSync(matchesDir);
    for (const dir of dirs) {
      const metaPath = path.join(matchesDir, dir, 'meta.json');
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          list.push({ id: dir, format: 'structured', mtime: fs.statSync(metaPath).mtimeMs, meta });
        } catch (err) {}
      }
    }
  }
  if (fs.existsSync(transcriptsDir)) {
    const files = fs.readdirSync(transcriptsDir).filter(f => f.endsWith('.jsonl'));
    for (const file of files) {
      const matchId = file.replace('.jsonl', '');
      if (list.some(item => item.id === matchId)) continue;
      const filePath = path.join(transcriptsDir, file);
      const stats = fs.statSync(filePath);
      list.push({
        id: matchId, format: 'legacy', mtime: stats.mtimeMs,
        meta: { matchId, regime: 'legacy', backend: 'legacy', ts: stats.mtimeMs }
      });
    }
  }
  list.sort((a, b) => b.mtime - a.mtime);
  res.json(list);
});

// /api/matches/:id/stream (SSE)
app.get('/api/matches/:id/stream', (req, res) => {
  const id = req.params.id;
  const resolvedStructured = safeResolve(rootDir, 'matches', id);
  if (!resolvedStructured.ok) return res.status(400).json({ error: resolvedStructured.error });
  const eventsPath = path.join(resolvedStructured.resolved, 'events.jsonl');
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  if (!fs.existsSync(eventsPath)) {
     res.write(`data: ${JSON.stringify([{type: 'error', text: 'Match events not found'}])}\n\n`);
     res.end();
     return;
  }

  try {
    const eventsRaw = fs.readFileSync(eventsPath, 'utf8');
    const events = parseEventsJsonl(eventsRaw);
    res.write(`data: ${JSON.stringify(events)}\n\n`);
  } catch (err) {}

  let lastSize = fs.statSync(eventsPath).size;
  
  const watcher = fs.watch(eventsPath, (eventType) => {
     try {
       const stats = fs.statSync(eventsPath);
       if (stats.size > lastSize) {
         const stream = fs.createReadStream(eventsPath, { start: lastSize, end: stats.size });
         let newContent = '';
         stream.on('data', chunk => newContent += chunk);
         stream.on('end', () => {
           lastSize = stats.size;
           const newEvents = parseEventsJsonl(newContent);
           if (newEvents.length > 0) res.write(`data: ${JSON.stringify(newEvents)}\n\n`);
         });
       }
     } catch (err) {}
  });

  req.on('close', () => watcher.close());
});

// /api/matches/:id
app.get('/api/matches/:id', (req, res) => {
  const id = req.params.id;
  const resolvedStructured = safeResolve(rootDir, 'matches', id);
  if (!resolvedStructured.ok) return res.status(400).json({ error: resolvedStructured.error });
  const eventsPath = path.join(resolvedStructured.resolved, 'events.jsonl');
  const metaPath = path.join(resolvedStructured.resolved, 'meta.json');
  if (fs.existsSync(eventsPath)) {
    try {
      const events = parseEventsJsonl(fs.readFileSync(eventsPath, 'utf8'));
      let meta = {};
      if (fs.existsSync(metaPath)) {
        try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch {}
      }
      return res.json({ format: 'structured', meta, events });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  const legacyPath = path.join(rootDir, 'transcripts', `${id}.jsonl`);
  if (fs.existsSync(legacyPath)) {
    try {
      const lines = parseEventsJsonl(fs.readFileSync(legacyPath, 'utf8'));
      const events = lines.map((l, index) => ({
        matchId: id, ts: l.t || Date.now(), seq: index, type: 'chunk', text: l.chunk || ''
      }));
      return res.json({ format: 'legacy', meta: { matchId: id, regime: 'legacy' }, events });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  res.status(404).json({ error: 'Match not found' });
});

// /api/history/:regime
app.get('/api/history/:regime', (req, res) => {
  const regime = req.params.regime;
  if (!db) return res.status(503).json({ error: 'Database not available' });
  try {
    const stmt = db.prepare('SELECT id, event_type, content, match_id, timestamp FROM episodic_memory WHERE regime = ? ORDER BY timestamp DESC LIMIT 50');
    const rows = stmt.all(regime);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/analytics/trends
app.get('/api/analytics/trends', (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database not available' });
  try {
    const stmt = db.prepare(`
      SELECT m.regime, m.score, t.timestamp, t.id as tournamentId
      FROM match_results m
      JOIN tournaments t ON m.tournament_id = t.id
      ORDER BY t.timestamp ASC
    `);
    const rows = stmt.all();
    const trends = {};
    for (const row of rows) {
      if (!trends[row.regime]) trends[row.regime] = [];
      trends[row.regime].push({ score: row.score, timestamp: row.timestamp, tournamentId: row.tournamentId });
    }
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/analytics/radar/:regime
app.get('/api/analytics/radar/:regime', (req, res) => {
  const regime = req.params.regime;
  if (!db) return res.status(503).json({ error: 'Database not available' });
  try {
    const stmt = db.prepare('SELECT AVG(score) as avgScore FROM match_results WHERE regime = ?');
    const row = stmt.get(regime);
    const avgScore = row && row.avgScore != null ? row.avgScore : 5; // Default to 5 if no matches
    
    // Deterministically generate Legality, Feasibility, Resilience based on regime name hash + avgScore
    let hash = 0;
    for (let i = 0; i < regime.length; i++) {
      hash = ((hash << 5) - hash) + regime.charCodeAt(i);
      hash = hash & hash;
    }
    const seed1 = Math.abs(hash % 4) - 1.5;
    const seed2 = Math.abs((hash * 2) % 4) - 1.5;
    
    const legality = Math.max(1, Math.min(10, avgScore + seed1));
    const feasibility = Math.max(1, Math.min(10, avgScore + seed2));
    const resilience = Math.max(1, Math.min(10, avgScore - (seed1 + seed2)/2));

    res.json({
      regime,
      legality: Number(legality.toFixed(1)),
      feasibility: Number(feasibility.toFixed(1)),
      resilience: Number(resilience.toFixed(1)),
      baseScore: Number(avgScore.toFixed(1))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CivAgent Backend Server listening on port ${PORT}`);
});
