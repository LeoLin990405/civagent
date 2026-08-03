// A constitutional signal must be distinguishable from prose ABOUT that signal.
// This used to also match the bare word "驳回" ("reject/return"), which is
// ordinary Chinese: 33 of the 57 regime files contain 驳回/诏书/圣旨 as plain
// historical vocabulary, while [VETO] is the only marker any regime actually
// teaches its agents to emit.
//
// The bare match was dormant only because office deliberation never reached this
// scanner — the old `-p` text output discarded it. The moment stream-json
// capture landed, a real Tang run was SIGKILLed mid-draft: the Secretariat was
// *describing* the Chancellery's power to amend and return documents
// ("直接在文书上批改驳回") and the engine read it as an act of veto.
//
// Bracketed markers only. A regime that wants a Chinese marker should be taught
// "[封驳]", which cannot occur by accident in prose.
const VETO_MARKERS = ["[VETO]", "[封驳]"];

export function checkVeto(chunkText, context) {
  const text = String(chunkText ?? "");
  if (VETO_MARKERS.some((m) => text.includes(m))) {
    if (context.vetoImmunity) {
      console.error("\n[v6-Mechanism] Veto attempted but bypassed due to active Imperial Edict (vetoImmunity).");
      return false;
    }
    if (!context.vetoTriggered) {
      context.vetoTriggered = true;
      console.error("\n[v6-Mechanism] VETO DETECTED! Hard-aborting execution to simulate constitutional veto.");
      context.log.emit("veto_triggered", { reason: "Constitutional veto executed by auditing agent." });
      
      // Trigger the SIGKILL through the provided process
      if (context.ccProcess) {
        context.ccProcess.kill("SIGKILL");
      }
      return true; // Veto was triggered
    }
  }
  return false;
}
