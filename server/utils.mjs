import path from 'node:path';
import fs from 'node:fs';

const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

export function safeResolve(root, ...segments) {
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

export function resolveFixedFile(validatedDir, filename) {
  if (filename === '.' || filename === '..' || filename.includes('/') || filename.includes('\\')) return null;
  const resolvedDir = path.resolve(validatedDir);
  const resolved = path.resolve(path.join(validatedDir, filename));
  if (resolved !== resolvedDir && !resolved.startsWith(resolvedDir + path.sep)) return null;
  return resolved;
}

export function parseEventsJsonl(raw) {
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
