import fs from 'node:fs';
import path from 'node:path';
import { queryEpisodicMemory } from './history-db.mjs';

/**
 * A lightweight Keyword-based RAG Retriever for historical context.
 * Reads the regime's README.md (which contains historical lore and precedents)
 * and retrieves the most relevant paragraphs based on the task prompt.
 */
export function retrieveHistoricalContext(regimeDir, taskPrompt) {
  const readmePath = path.join(regimeDir, 'README.md');
  if (!fs.existsSync(readmePath)) return '';

  try {
    const content = fs.readFileSync(readmePath, 'utf8');
    // Split by paragraphs
    const paragraphs = content.split('\n\n').map(p => p.trim()).filter(Boolean);
    
    // Extract keywords from taskPrompt (basic tokenizer)
    const keywords = taskPrompt.toLowerCase().split(/[\s,，.。;；?？!！]+/).filter(w => w.length > 1);
    
    if (keywords.length === 0) return '';

    const scoredParagraphs = paragraphs.map(p => {
      let score = 0;
      const lowerP = p.toLowerCase();
      for (const kw of keywords) {
        if (lowerP.includes(kw)) score++;
      }
      return { text: p, score };
    });

    // Sort by descending score
    scoredParagraphs.sort((a, b) => b.score - a.score);
    
    // Return top 3 paragraphs that have at least 1 keyword match
    const top = scoredParagraphs.filter(p => p.score > 0).slice(0, 3);
    
    // 2. Retrieve Episodic Memory from previous tournaments
    const episodicMatches = queryEpisodicMemory(regimeDir.split('/').pop(), keywords);
    
    let resultString = '';
    
    if (top.length > 0) {
      resultString += `\n\n### 📜 Archival Retrieval — Bureau of Historiography (Static RAG)\n\nFor the present task, the Hanlin Academy has drawn the following references from the historical record:\n\n` + top.map(t => `> ${t.text}`).join('\n\n') + '\n';
    }

    if (episodicMatches.length > 0) {
      resultString += `\n\n### 🔮 Precedents from Prior Deliberations (Episodic Memory RAG)\n\nAcross earlier simulations your polity (or comparable systems) accumulated the following successes and failures — heed these lessons:\n\n` + episodicMatches.map(m => `> [${m.timestamp}] ${m.content}`).join('\n\n') + '\n';
    }

    return resultString;
  } catch (err) {
    console.error(`[RAG Error] Failed to retrieve context: ${err.message}`);
    return '';
  }
}
