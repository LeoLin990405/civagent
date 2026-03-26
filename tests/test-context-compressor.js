#!/usr/bin/env node
/**
 * Context Compressor 单元测试
 */

const assert = require('assert');
const compressor = require('../scripts/context-compressor');

function testIdentifyMessageType() {
  console.log('🧪 测试：消息类型识别');
  
  assert.strictEqual(
    compressor.identifyMessageType({ content: '我们决定使用 JWT 方案' }),
    'decision'
  );
  
  assert.strictEqual(
    compressor.identifyMessageType({ content: '代码已完成，提交到 GitHub' }),
    'artifact'
  );
  
  assert.strictEqual(
    compressor.identifyMessageType({ content: '遇到错误：网络超时' }),
    'error'
  );
  
  assert.strictEqual(
    compressor.identifyMessageType({ content: '执行计划如下：第一步...' }),
    'plan'
  );
  
  console.log('  ✅ 通过');
}

function testCompressConversation() {
  console.log('🧪 测试：对话压缩');
  
  const messages = [
    { content: '我们决定使用 JWT 方案', role: 'assistant' },
    { content: '代码已完成', role: 'assistant' },
    { content: '最终结果：成功', role: 'assistant' }
  ];
  
  const compressed = compressor.compressConversation(messages);
  
  assert(compressed.original.messageCount === 3);
  assert(compressed.compressionRate >= 0);
  assert(compressed.summary === null || typeof compressed.summary === 'string');
  
  console.log('  ✅ 通过');
}

function testEstimateTokens() {
  console.log('🧪 测试：Token 估算');
  
  const messages = [{ content: 'Hello World 测试' }];
  const tokens = compressor.estimateTokens(messages);
  
  assert(tokens > 0);
  assert(tokens <= 10);
  
  console.log('  ✅ 通过');
}

function testGenerateSummary() {
  console.log('🧪 测试：摘要生成');
  
  const messages = [
    { content: '实现登录 API，使用 JWT 方案' },
    { content: '遇到问题：rate limiting 未实现' },
    { content: '已修复 rate limiting' }
  ];
  
  const summary = compressor.generateSummary(messages);
  
  assert(summary.includes('讨论摘要'));
  assert(summary.length > 10);
  
  console.log('  ✅ 通过');
}

function runTests() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Context Compressor 单元测试          ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');
  
  try {
    testIdentifyMessageType();
    testCompressConversation();
    testEstimateTokens();
    testGenerateSummary();
    
    console.log('');
    console.log('✅ 所有测试通过！');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.log('');
    console.log('❌ 测试失败:', error.message);
    console.log('');
    
    process.exit(1);
  }
}

runTests();
