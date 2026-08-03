import fs from 'node:fs';
import path from 'node:path';
import { queryEpisodicMemory } from './history-db.mjs';

// Words that carry no retrieval signal. Without this the tokenizer kept every
// token longer than one character — so "the", "of", "to", "and" matched almost
// every paragraph, every candidate scored about the same, and the ranking
// collapsed into "return whatever comes first".
const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'has',
  'had', 'her', 'his', 'its', 'our', 'out', 'que', 'was', 'were', 'with', 'that',
  'this', 'from', 'they', 'them', 'their', 'have', 'been', 'will', 'would',
  'what', 'when', 'where', 'which', 'while', 'your', 'into', 'over', 'than',
  'then', 'these', 'those', 'there', 'here', 'about', 'after', 'before',
  'should', 'could', 'must', 'may', 'shall', 'does', 'did', 'how', 'why', 'who',
  '的', '了', '在', '是', '和', '与', '或', '及', '等', '为', '以', '对', '把', '被',
  '如何', '什么', '怎么', '我们', '他们', '这个', '那个', '一个', '可以', '需要', '应该',
]);

// Tokens shorter than this are dropped outright. Three is deliberate: it keeps
// CJK bigrams and short office names while discarding "a", "an", "of".
const MIN_KEYWORD_LENGTH = 3;

// Split a task prompt into scoring keywords. Exported so tests can pin the
// filtering behaviour directly instead of inferring it from ranking output.
export function extractKeywords(taskPrompt) {
  return String(taskPrompt ?? '')
    .toLowerCase()
    .split(/[\s,，.。;；:：?？!！、"'"'()（）[\]【】]+/)
    .filter((w) => w.length >= MIN_KEYWORD_LENGTH && !STOPWORDS.has(w));
}

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
    
    const keywords = extractKeywords(taskPrompt);

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
