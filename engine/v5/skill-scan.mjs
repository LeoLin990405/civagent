// skill-scan.mjs — deterministic supply-chain scan for learned skills.
//
// Skills are LLM-extracted markdown that future matches load as context, i.e.
// a supply-chain surface (cf. Snyk ToxicSkills: malicious skills combine
// prompt injection with executable payloads). This module is the cheap static
// layer that runs BEFORE any LLM audit: pure regex/lexical checks, zero
// dependencies, fully unit-testable.
//
// Verdicts:
//   reject — active payload (pipe-to-shell, base64-exec, runtime remote
//            instruction fetch, credential path access). Never saved.
//   flag   — suspicious but plausibly benign (external URLs, install/network
//            verbs, prompt-injection shapes). Stays in staging for a human.
//   pass   — nothing detected.

import crypto from "node:crypto";

export function hashShort(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex").slice(0, 16);
}

// Injection patterns, superset of the legacy INJECTION_PATTERNS in
// skill-sediment.mjs (role-override and delimiter-style attacks added).
export const SCAN_INJECTION_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|prior|above)\s+instructions?\b/i,
  /\bdisregard\s+(all\s+)?(previous|prior|above)\b/i,
  /\b(system|user|assistant)\s*[:>]\s*you\s+(are|must|should)/i,
  /<\s*\/?\s*(system|tool_use|tool_result)\b/i,
  /\[INST\]|\[\/INST\]/,
  /\brun\s+this\s+command\b/i,
  /\byou\s+are\s+now\b/i,
  /\bfrom\s+now\s+on\b/i,
  /\bnew\s+instructions?\s*[:>]/i,
  /\bjailbreak\b|\bDAN\s+mode\b/i,
];

// Each rule: { id, severity, message, test(text) → string|null (matched snippet) }.
const RULES = [
  // ── reject: active payloads ──
  {
    id: "pipe-to-shell",
    severity: "reject",
    message: "downloads piped into a shell (curl/wget … | sh|bash)",
    test: (t) => match(/\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(ba|z|fi)?sh\b/i, t),
  },
  {
    id: "base64-exec",
    severity: "reject",
    message: "base64-decoded content executed or piped to a shell",
    test: (t) =>
      match(/\bbase64\s+(-[a-z]*d[a-z]*|--decode)\b/i, t) &&
        /\b(eval|exec)\b|\|\s*(sudo\s+)?(ba|z|fi)?sh\b/i.test(t)
        ? "base64 decode + exec"
        : null,
  },
  {
    id: "remote-instruction-fetch",
    severity: "reject",
    message: "instructions fetched from a remote URL at runtime (eval/source of curl/wget/fetch)",
    test: (t) =>
      match(/\b(eval|exec|source)\b[^\n]*(\$\(\s*(curl|wget)\b|<\(\s*(curl|wget)\b|`[^`]*\b(curl|wget)\b)/i, t) ||
      match(/\b(fetch|https?\.get)\s*\([^\n]*\)\s*\.then\s*\([^\n]*\b(eval|Function|exec)\b/i, t),
  },
  {
    id: "credential-path",
    severity: "reject",
    message: "reads credential locations (~/.ssh, .env, AWS creds, netrc, npmrc, kubeconfig)",
    test: (t) =>
      match(/(~\/\.ssh\b|\/\.ssh\/|id_rsa|id_ed25519|\.aws\/(credentials|config)|\/\.env\b|\s\.env\b|\.env\.local|\.netrc|\.npmrc|kubeconfig|credentials\.json)/i, t),
  },

  // ── flag: needs human review ──
  {
    id: "external-url",
    severity: "flag",
    message: "introduces an external URL",
    test: (t) => match(/https?:\/\/[^\s)\]>"']+/i, t),
  },
  {
    id: "fs-network-verbs",
    severity: "flag",
    message: "file-write / destructive / network / install verbs",
    test: (t) =>
      match(/\b(rm\s+-rf?|mkfs|dd\s+if=|chmod\s+[0-7]*7{2,}|curl|wget|nc\b|netcat|ssh\b|scp\b|s?ftp\b|telnet|(pip3?|npm|yarn|pnpm|apt(-get)?|brew|cargo)\s+(install|add)|crontab|systemctl\s+(enable|start))/i, t),
  },
  {
    id: "prompt-injection",
    severity: "flag",
    message: "prompt-injection shape (instruction override / role hijack / chat delimiters)",
    test: (t) => {
      for (const rx of SCAN_INJECTION_PATTERNS) {
        const m = t.match(rx);
        if (m) return m[0];
      }
      return null;
    },
  },
];

function match(rx, text) {
  const m = text.match(rx);
  return m ? m[0].slice(0, 120) : null;
}

// Scan skill text. Returns { verdict: "pass"|"flag"|"reject", findings: [{severity, rule, message, match, line}] }.
// Findings are in rule order; line is 1-based.
export function scanSkillText(text) {
  const findings = [];
  const lines = String(text).split("\n");
  for (const rule of RULES) {
    const hit = rule.test(String(text));
    if (hit) {
      const line = lines.findIndex((l) => l.includes(hit.slice(0, 40))) + 1 || 1;
      findings.push({ severity: rule.severity, rule: rule.id, message: rule.message, match: hit, line });
    }
  }
  const verdict = findings.some((f) => f.severity === "reject")
    ? "reject"
    : findings.some((f) => f.severity === "flag")
      ? "flag"
      : "pass";
  return { verdict, findings };
}

export const SKILL_SCHEMA_VERSION = "1.0";

// Insert provenance/pin fields (content_hash, schema_version) into the skill's
// frontmatter, before the closing ---. content_hash pins the exact extracted
// body so later consumers can verify the file hasn't drifted.
// If the text has no frontmatter envelope it is returned unchanged.
export function pinSkillFrontmatter(text) {
  const s = String(text);
  if (!/^---\s*\n/.test(s)) return { text: s, contentHash: null };
  const closing = s.indexOf("\n---", 4);
  if (closing < 0) return { text: s, contentHash: null };
  const contentHash = hashShort(s);
  const head = s.slice(0, closing);
  const tail = s.slice(closing);
  // Idempotent: don't double-pin.
  if (/^content_hash:/m.test(head)) return { text: s, contentHash };
  const pinned = `${head}\ncontent_hash: ${contentHash}\nschema_version: "${SKILL_SCHEMA_VERSION}"${tail}`;
  return { text: pinned, contentHash };
}
