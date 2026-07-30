export function checkImpeach(chunkText, context) {
  // Bracketed markers only — see engine/mechanisms/veto.mjs. "弹劾：某某"
  // ("impeach: so-and-so") appears in ordinary historical narration of a
  // censorate's duties, so the unbracketed form cannot be told apart from an
  // actual act of impeachment once office prose is captured.
  const text = String(chunkText ?? "");
  const match = text.match(/\[IMPEACH:\s*([^\]]+)\]/i) || text.match(/\[弹劾[:：]\s*([^\]]+)\]/i);
  if (match) {
    const target = match[1].trim();
    // To prevent infinite loops or spam, check if we already impeached this target recently
    if (!context.impeachments) context.impeachments = new Set();
    
    if (!context.impeachments.has(target)) {
      context.impeachments.add(target);
      console.error(`\n[v6-Mechanism] IMPEACHMENT DETECTED! Target: ${target}. Logging historical event.`);
      
      context.log.emit("impeach_triggered", { 
        target: target,
        reason: "Censorate or equivalent authority has issued a formal impeachment." 
      });
      
      return true;
    }
  }
  return false;
}
