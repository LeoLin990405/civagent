// stream-json.mjs — turn Claude Code's `--output-format stream-json` lines into
// the plain transcript the judge, the skill extractor and the dashboard read.
//
// WHY THIS EXISTS
//
// The backend used to be spawned as `claude --agents <json> -p "<task>"`. The
// default output format for `-p` is `text`, and `text` prints exactly one
// thing: the coordinator's final assistant message. A regime's offices are
// Claude Code subagents, so everything they said to each other went to the
// subagent channel and was thrown away.
//
// That is not a cosmetic loss. In the E1 pilot, three of fifteen transcripts
// contained no policy at all — only a claim that an edict "was already drafted,
// debated through two rounds of Menxia veto, revised, countersigned and
// dispatched to the Six Boards within this conversation", none of which was in
// the stream. Each of those three scored last in its scenario. The ranking was
// partly measuring whether a regime happened to restate its work in the final
// message, which is a stylistic coin flip, not a property of its topology.
//
// Measured on one real Tang run of the same task: 328 characters captured under
// `text`, 4,663 recoverable from `stream-json` — including the Chancellery's
// review verdict ("可行，封驳无异议"), which is the single most important
// behavioural signal a checks-and-balances regime produces.
//
// ATTRIBUTION
//
// A dispatch is a `tool_use` whose `input.subagent_type` names the office; the
// office's reply carries `parent_tool_use_id` pointing back at that tool_use id.
// StreamRenderer holds that mapping, so a rendered line can say which office
// produced it. This is also the mapping engine/v5/runtime-graph.mjs needs to
// compare declared edges against exercised ones at office rather than regime
// level — see README §9.6.
//
// ROBUSTNESS
//
// Nothing here may swallow output. A line that is not JSON, or is JSON in an
// unexpected shape, is passed through verbatim: the harness's own "[v5] ..."
// status lines travel the same channel, and a backend that ignores
// --output-format must degrade to today's behaviour rather than to silence.

// Tool results for an asynchronous Agent launch are internal bookkeeping. Their
// own text says "never quote or paste any part of it, including the agentId".
// Echoing it would put an instruction-shaped string in front of the judge and
// leak an internal id into a transcript that gets shown and stored.
const INTERNAL_RESULT_MARKERS = [
  "This tool result is internal metadata",
  "Async agent launched successfully",
];

function textOfToolResultContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((c) => (c && typeof c.text === "string" ? c.text : ""))
    .filter(Boolean)
    .join("\n");
}

// Render one line. Returns { text, actor, messageRole, contentItems } or null
// when the line carries no deliberation (system init, result accounting,
// internal metadata).
//
// `text` and `actor` are the legacy fields — unchanged semantics.
// `messageRole` is 'assistant' | 'user' | null (non-message lines).
// `contentItems` is an array of structured item descriptors, ADDITIVE (new):
//   { type: 'text', text }              — plain text segment
//   { type: 'tool_use', id, office, description? } — a subagent dispatch
//   { type: 'tool_result', tool_use_id, is_internal } — a tool result
//
// `resolveOffice` maps a parent_tool_use_id back to the office it was sent to;
// callers without that state (single-line use) get null attribution.
export function renderStreamLine(line, resolveOffice = () => null) {
  const raw = String(line ?? "");
  if (!raw.trim()) return null;

  let ev;
  try {
    ev = JSON.parse(raw);
  } catch {
    return { text: raw, actor: null, messageRole: null, contentItems: [] };
  }
  if (!ev || typeof ev !== "object") return { text: raw, actor: null, messageRole: null, contentItems: [] };

  switch (ev.type) {
    case "system":
      return null;
    case "result":
      return null;
    case "assistant":
    case "user":
      break;
    default:
      return null;
  }

  const messageRole = ev.type; // 'assistant' | 'user'
  const content = ev.message?.content;
  if (typeof content === "string") {
    return content.trim()
      ? { text: content, actor: resolveOffice(ev.parent_tool_use_id), messageRole, contentItems: [] }
      : null;
  }
  if (!Array.isArray(content)) return null;

  const office = resolveOffice(ev.parent_tool_use_id);
  const out = [];
  const contentItems = [];
  for (const item of content) {
    if (!item || typeof item !== "object") continue;
    if (item.type === "text" && typeof item.text === "string" && item.text.trim()) {
      out.push(item.text);
      contentItems.push({ type: "text", text: item.text });
    } else if (item.type === "tool_use") {
      const to = item.input?.subagent_type;
      const what = item.input?.description;
      if (to) {
        out.push(`[→ ${to}]${what ? ` ${what}` : ""}`);
        contentItems.push({
          type: "tool_use",
          id: item.id ?? null,
          office: to,
          ...(what ? { description: what } : {}),
        });
      }
    } else if (item.type === "tool_result") {
      const t = textOfToolResultContent(item.content);
      if (!t.trim()) continue;
      const isInternal = INTERNAL_RESULT_MARKERS.some((m) => t.includes(m));
      if (isInternal) continue;
      out.push(t);
      contentItems.push({
        type: "tool_result",
        tool_use_id: item.tool_use_id ?? null,
        is_internal: false,
      });
    }
  }
  if (!out.length) return null;
  return { text: out.join("\n"), actor: office, messageRole, contentItems };
}

// Stateful wrapper that remembers which office each dispatch went to, so an
// office's reply can be attributed to it.
export class StreamRenderer {
  constructor() {
    this.officeByToolUseId = new Map();
  }

  render(line) {
    // Learn the dispatch mapping before rendering, so a reply arriving in the
    // same batch as its dispatch still resolves.
    try {
      const ev = JSON.parse(String(line ?? ""));
      const content = ev?.message?.content;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item?.type === "tool_use" && item.id && item.input?.subagent_type) {
            this.officeByToolUseId.set(item.id, item.input.subagent_type);
          }
        }
      }
    } catch {
      // Not JSON; renderStreamLine will pass it through.
    }
    return renderStreamLine(line, (id) => (id ? this.officeByToolUseId.get(id) ?? null : null));
  }
}
