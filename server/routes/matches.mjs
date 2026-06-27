import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { safeResolve, parseEventsJsonl } from '../utils.mjs';

const rootDir = path.join(os.homedir(), '.civagent');

const router = express.Router();

// /api/matches
router.get('/', (req, res) => {
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
router.get('/:id/stream', (req, res) => {
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
router.get('/:id', (req, res) => {
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

export default router;
