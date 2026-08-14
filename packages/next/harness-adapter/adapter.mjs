/**
 * adapter.mjs — the ONLY import boundary to pinned DeepSeek Harness/Cordis.
 *
 * Plan §4.2: only packages/next/harness-adapter may depend on @deepseek-ai/*
 * or Cordis. It imports only package exports (never internal source paths),
 * translates external types into @civagent/contracts types at the boundary,
 * exposes capability/version metadata to the manifest, and contains no
 * CivAgent tournament/topology/policy/judge decisions.
 *
 * Seam loading is lazy and pin-resolved: the package module itself loads even
 * when the pin build is absent (functions throw with a clear message); the
 * contract tests exercise the real seams when the pin is present.
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const ADAPTER_VERSION = "harness-adapter/0.1.0";
export const HARNESS_PIN = "47f943859bef60e4160492346772ded9b24f765a";
export const HARNESS_PIN_SHORT = HARNESS_PIN.slice(0, 7);
export const SEAM_EXPORTS = [
  "@deepseek-ai/cordis",
  "@deepseek-ai/dsh-session", "@deepseek-ai/dsh-session/surface",
  "@deepseek-ai/dsh-llm", "@deepseek-ai/dsh-llm-deepseek",
  "@deepseek-ai/dsh-agent", "@deepseek-ai/dsh-agent-loop",
  "@deepseek-ai/dsh-system-prompt", "@deepseek-ai/dsh-tools",
  "@deepseek-ai/dsh-credentials", "@deepseek-ai/dsh-typert-protocol",
  "@deepseek-ai/dsh-typert-registry", "@deepseek-ai/dsh-client-connection",
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FARM = path.join(__dirname, "node_modules", "@deepseek-ai");

/** Resolve the pinned Harness build directory (env override, then local). */
export function resolvePinDir() {
  const valid = (dir) =>
    dir &&
    fs.existsSync(path.join(dir, "vendor", "cordis", "package.json")) &&
    fs.existsSync(path.join(dir, "packages", "llm", "llm", "lib", "index.js"));
  if (process.env.HARNESS_PIN_DIR && valid(process.env.HARNESS_PIN_DIR)) return process.env.HARNESS_PIN_DIR;
  const candidates = [
    "/tmp/dsh-pin", // the verified pinned clone+build (P1 evidence)
    path.join(__dirname, "harness-pin"),
  ];
  for (const c of candidates) {
    if (valid(c)) return c;
  }
  return null;
}

/** Capability/version metadata consumed by the RuntimeManifest (plan §11.2). */
export function adapterCapabilities() {
  return {
    adapter: "harness-adapter",
    version: ADAPTER_VERSION,
    pin: HARNESS_PIN,
    pinShort: HARNESS_PIN_SHORT,
    seams: SEAM_EXPORTS,
    pinResolved: resolvePinDir() !== null,
    importPolicy: "package-exports-only",
  };
}

/** Lazy-load the real seam modules through the exports maps. */
export async function loadSeams(pinOverride = null) {
  const pin = pinOverride ?? resolvePinDir();
  if (!pin || !fs.existsSync(pin)) throw new Error("pinned Harness build not found (HARNESS_PIN_DIR or /tmp/dsh-pin); run link-pin.mjs after building the pin");
  await ensureFarm(pin);
  const [cordis, session, surface, llm, llmDeepseek, agentLoop, credentials] = await Promise.all([
    import("@deepseek-ai/cordis"),
    import("@deepseek-ai/dsh-session"),
    import("@deepseek-ai/dsh-session/surface"),
    import("@deepseek-ai/dsh-llm"),
    import("@deepseek-ai/dsh-llm-deepseek"),
    import("@deepseek-ai/dsh-agent-loop"),
    import("@deepseek-ai/dsh-credentials"),
  ]);
  return { pin, cordis, session, surface, llm, llmDeepseek, agentLoop, credentials };
}

/** Create the local node_modules symlink farm from the pinned build. */
export async function ensureFarm(pin = resolvePinDir()) {
  if (!pin) return false;
  const mapping = [
    ["cordis", path.join(pin, "vendor", "cordis")],
    ["dsh-llm", path.join(pin, "packages", "llm", "llm")],
    ["dsh-llm-deepseek", path.join(pin, "packages", "llm", "llm-deepseek")],
    ["dsh-agent", path.join(pin, "packages", "core", "agent")],
    ["dsh-agent-loop", path.join(pin, "packages", "core", "agent-loop")],
    ["dsh-session", path.join(pin, "packages", "core", "session")],
    ["dsh-system-prompt", path.join(pin, "packages", "core", "system-prompt")],
    ["dsh-tools", path.join(pin, "packages", "core", "tools")],
    ["dsh-credentials", path.join(pin, "packages", "credentials", "credentials")],
    ["dsh-typert-protocol", path.join(pin, "packages", "typert", "protocol")],
    ["dsh-typert-registry", path.join(pin, "packages", "typert", "registry")],
    ["dsh-client-connection", path.join(pin, "packages", "client", "connection")],
  ];
  fs.mkdirSync(FARM, { recursive: true });
  const created = [];
  for (const [name, target] of mapping) {
    const dest = path.join(FARM, name);
    try {
      const existing = fs.readlinkSync(dest);
      if (existing === target) continue;
      fs.rmSync(dest, { recursive: true, force: true });
    } catch { /* not a link yet */ }
    fs.symlinkSync(target, dest, "dir");
    created.push(`@deepseek-ai/${name}`);
  }
  return created;
}

// ── Boundary facades: translate external types at the edge ────────────────

/** A Cordis root Context (scoped per plan §1: lifecycle mechanism only). */
export async function createCordisContext() {
  const { cordis } = await loadSeams();
  return { context: new cordis.Context(), adapterVersion: ADAPTER_VERSION, pin: HARNESS_PIN_SHORT };
}

/** SurfaceManager over a caller-owned log (their envelope is the seam). */
export async function createSurfaceManager(log = [], baseSeq = 0) {
  const { surface } = await loadSeams();
  const manager = new surface.SurfaceManager(log, baseSeq);
  return { manager, fold: (events) => surface.foldSurface(events), adapterVersion: ADAPTER_VERSION };
}

/**
 * DeepSeek adapter engineering smoke: instantiate the pinned DeepSeekAdapter
 * with a scripted config (no network at construction) and verify model
 * resolution through the seam's own code path. Returns plain contracts data.
 */
export async function deepseekAdapterSmoke({ models = [{ id: "deepseek-chat", contextWindow: 65536, maxTokens: 8192 }], defaultContextWindow = 65536, maxTokens = 8192, defaults = { thinking: "disabled", reasoningEffort: "off" }, retryPolicy = { maxRetries: 0 } } = {}) {
  const { llmDeepseek } = await loadSeams();
  const adapter = new llmDeepseek.DeepSeekAdapter({
    options: () => ({ models, defaultContextWindow, maxTokens, defaults, retryPolicy }),
  });
  const listed = await adapter.listModels("deepseek");
  const resolved = await adapter.resolveModel("deepseek", models[0].id, undefined);
  return {
    adapterVersion: ADAPTER_VERSION,
    seamVersion: llmDeepseek.DeepSeekAdapter ? "0.1.0-rc.5" : null,
    providerInfo: adapter.providerInfo("deepseek"),
    listed: listed.map((m) => ({ id: m.id, contextWindow: m.contextWindow ?? null })),
    resolved: { id: resolved.id, contextWindow: resolved.context?.contextWindow ?? null, defaultMaxTokens: resolved.defaultMaxTokens ?? null },
    network: { touched: false, reason: "scripted config; live lane requires credentials (P6)" },
  };
}
