export function checkEdict(chunkText, context) {
  if (chunkText.includes("[EDICT]") || chunkText.includes("圣旨") || chunkText.includes("诏书")) {
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
