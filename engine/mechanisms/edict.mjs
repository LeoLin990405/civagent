export function checkEdict(chunkText, context) {
  // Bracketed markers only — see engine/mechanisms/veto.mjs for the full
  // rationale. "诏书" (edict) is the most common noun in a Tang governance
  // document; firing on it grants vetoImmunity, which disables the veto
  // mechanism, so a checks-and-balances regime would silently lose the very
  // behaviour under study the moment its offices' prose was captured.
  if (["[EDICT]", "[圣旨]", "[诏书]"].some((m) => String(chunkText ?? "").includes(m))) {
    if (!context.edictTriggered) {
      context.edictTriggered = true;
      console.error("\n[v6-Mechanism] IMPERIAL EDICT DETECTED! Overriding regular bureaucratic channels.");
      
      context.log.emit("edict_triggered", { 
        reason: "Absolute authority exercised to bypass standard procedures." 
      });
      
      // An edict might immune the process from vetoes for the remainder of the turn
      context.vetoImmunity = true;
      
      return true;
    }
  }
  return false;
}
