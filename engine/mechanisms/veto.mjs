export function checkVeto(chunkText, context) {
  // Mechanism: VETO / REJECT signal detection
  if (chunkText.includes("[VETO]") || chunkText.includes("驳回")) {
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
