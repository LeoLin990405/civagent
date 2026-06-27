export function checkImpeach(chunkText, context) {
  const match = chunkText.match(/\[IMPEACH:\s*([^\]]+)\]/i) || chunkText.match(/弹劾[:：]\s*([^\]\n]+)/i);
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
