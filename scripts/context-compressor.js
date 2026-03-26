#!/usr/bin/env node
/**
 * Context Compressor - 智能上下文压缩
 * 
 * @fileoverview 解决长任务链 context 爆炸问题
 * - 基于重要性评分保留关键信息
 * - 压缩中间讨论、尝试过程
 * - 使用 LLM 生成摘要
 * 
 * @version 2.0.0
 * @author 工部
 * 
 * 用法：
 *   node context-compressor.js compress --input conversation.json --output compressed.json
 *   node context-compressor.js summarize --input long_text.txt --max-tokens 500
 */

const fs = require('fs');
const path = require('path');
const { AppError, ErrorCode } = require('./error');
const log = require('./logger');

/**
 * 配置
 */
const Config = {
  // 重要性评分权重
  weights: {
    decision: 10,      // 关键决策
    artifact: 9,       // 交付物
    error: 8,          // 错误信息
    approval: 8,       // 用户确认
    plan: 7,           // 执行计划
    result: 9,         // 最终结果
    discussion: 2,     // 讨论过程
    attempt: 1,        // 尝试过程
    brainstorm: 2,     // 头脑风暴
    clarification: 3   // 澄清问答
  },
  
  // 触发压缩的阈值
  thresholds: {
    messageCount: 20,
    tokenCount: 4000,
    ageMinutes: 30
  },
  
  // 保留比例（保留前 N% 重要消息）
  keepRatio: 0.4,
  
  // 摘要配置
  summary: {
    maxTokens: 500,
    style: 'concise'
  }
};

/**
 * 消息重要性评分
 * @param {object} message 
 * @returns {number}
 */
function calculateImportance(message) {
  const type = identifyMessageType(message);
  const baseScore = Config.weights[type] || 5;
  
  // 时间衰减（越近越重要）
  const age = Date.now() - new Date(message.timestamp || Date.now()).getTime();
  const timeFactor = Math.max(0.5, 1 - (age / (1000 * 60 * 60))); // 1 小时内衰减
  
  // 长度因子（过短可能不重要）
  const length = (message.content || '').length;
  const lengthFactor = length > 10 ? 1 : 0.5;
  
  // 角色因子（用户消息通常更重要）
  const roleFactor = message.role === 'user' ? 1.2 : 1;
  
  return baseScore * timeFactor * lengthFactor * roleFactor;
}

/**
 * 识别消息类型
 * @param {object} message 
 * @returns {string}
 */
function identifyMessageType(message) {
  const text = (message.content || '').toLowerCase();
  const role = message.role || 'user';
  
  const patterns = {
    decision: ['决定', '采用', '选择', 'decided', 'adopt', 'choose'],
    artifact: ['代码', '文档', '完成', '提交', 'code', 'document', 'completed', 'commit'],
    error: ['错误', '失败', 'bug', 'error', 'failed', 'exception'],
    approval: ['确认', '同意', '批准', 'approve', 'confirm'],
    plan: ['计划', '步骤', '方案', 'plan', 'step', 'approach'],
    result: ['结果', '总结', '汇报', 'result', 'summary', 'report'],
    discussion: ['讨论', '考虑', '可能', 'discuss', 'consider', 'maybe'],
    attempt: ['尝试', '试试', 'attempt', 'try', 'experiment'],
    brainstorm: ['想法', '建议', 'idea', 'suggest', 'brainstorm'],
    clarification: ['什么', '怎么', '为什么', 'what', 'how', 'why']
  };
  
  for (const [type, keywords] of Object.entries(patterns)) {
    if (keywords.some(kw => text.includes(kw))) {
      return type;
    }
  }
  
  return 'discussion'; // 默认
}

/**
 * 压缩上下文
 * @param {Array} messages - 原始消息列表
 * @param {object} options - 选项
 * @returns {object} 压缩结果
 */
function compress(messages, options = {}) {
  try {
    if (!Array.isArray(messages)) {
      throw new AppError(
        ErrorCode.CONTEXT_TOO_LARGE,
        'Messages must be an array',
        { type: typeof messages }
      );
    }
    
    if (messages.length === 0) {
      return {
        messages: [],
        summary: 'No messages to compress',
        stats: { original: 0, compressed: 0 }
      };
    }
    
    // 计算每条消息的重要性评分
    const scored = messages.map((msg, index) => ({
      ...msg,
      index,
      score: calculateImportance(msg)
    }));
    
    // 按重要性排序
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    
    // 保留前 N% 重要的消息
    const keepCount = Math.max(5, Math.floor(messages.length * Config.keepRatio));
    const kept = sorted.slice(0, keepCount);
    
    // 恢复原始顺序
    const compressed = kept.sort((a, b) => a.index - b.index);
    
    // 生成摘要
    const summary = generateSummary(compressed, options);
    
    // 统计
    const stats = {
      original: messages.length,
      compressed: compressed.length,
      ratio: (compressed.length / messages.length * 100).toFixed(1) + '%',
      topScore: sorted[0]?.score?.toFixed(2) || 0,
      avgScore: (sorted.reduce((sum, m) => sum + m.score, 0) / sorted.length).toFixed(2)
    };
    
    log.info('[Context] Compressed', stats);
    
    return {
      messages: compressed,
      summary,
      stats
    };
  } catch (error) {
    log.error('[Context] Compress failed', { error });
    throw new AppError(ErrorCode.CONTEXT_COMPRESS_FAILED, error.message, {}, error);
  }
}

/**
 * 生成摘要
 * @param {Array} messages 
 * @param {object} options 
 * @returns {string}
 */
function generateSummary(messages, options = {}) {
  if (messages.length === 0) return 'No content';
  
  const contents = messages
    .filter(m => m.content)
    .map(m => m.content)
    .join('\n\n');
  
  // 简单摘要（实际项目中应调用 LLM）
  const maxLength = options.maxTokens || Config.summary.maxTokens * 4; // 粗略估算
  if (contents.length <= maxLength) {
    return contents;
  }
  
  return contents.substring(0, maxLength) + '...';
}

/**
 * CLI 入口
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'compress') {
    const inputIdx = args.indexOf('--input');
    const outputIdx = args.indexOf('--output');
    
    if (inputIdx === -1) {
      console.error('Usage: node context-compressor.js compress --input <file> [--output <file>]');
      process.exit(1);
    }
    
    const inputFile = args[inputIdx + 1];
    const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;
    
    try {
      const messages = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
      const result = compress(messages);
      
      if (outputFile) {
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
        console.log(`✅ Compressed: ${messages.length} -> ${result.messages.length} messages`);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Context Compressor v2.0.0');
    console.log('Usage: node context-compressor.js compress --input <file> [--output <file>]');
  }
}

module.exports = {
  compress,
  calculateImportance,
  identifyMessageType,
  Config
};
