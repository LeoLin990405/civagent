/**
 * Context Compressor 单元测试
 */

const assert = require('assert');
const { compress, calculateImportance, identifyMessageType, Config } = require('../scripts/context-compressor');

describe('Context Compressor', () => {
  describe('identifyMessageType', () => {
    it('should identify decision message', () => {
      const msg = { content: '我们决定采用 Node.js 方案', role: 'user' };
      assert.strictEqual(identifyMessageType(msg), 'decision');
    });
    
    it('should identify artifact message', () => {
      const msg = { content: '代码已完成并提交', role: 'assistant' };
      assert.strictEqual(identifyMessageType(msg), 'artifact');
    });
    
    it('should identify error message', () => {
      const msg = { content: '出现错误：连接失败', role: 'assistant' };
      assert.strictEqual(identifyMessageType(msg), 'error');
    });
    
    it('should default to discussion', () => {
      const msg = { content: '今天天气不错', role: 'user' };
      assert.strictEqual(identifyMessageType(msg), 'discussion');
    });
  });
  
  describe('calculateImportance', () => {
    it('should give high score to decision', () => {
      const msg = { content: '决定采用方案 A', role: 'user', timestamp: new Date().toISOString() };
      const score = calculateImportance(msg);
      assert(score > 5, 'Decision should have high score');
    });
    
    it('should give low score to discussion', () => {
      const msg = { content: '我们在讨论可能性', role: 'assistant', timestamp: new Date().toISOString() };
      const score = calculateImportance(msg);
      assert(score < 5, 'Discussion should have low score');
    });
  });
  
  describe('compress', () => {
    it('should compress messages based on importance', () => {
      const messages = [
        { content: '决定采用方案 A', role: 'user', timestamp: new Date().toISOString() },
        { content: '讨论中...', role: 'assistant', timestamp: new Date().toISOString() },
        { content: '代码已完成', role: 'assistant', timestamp: new Date().toISOString() },
        { content: '闲聊', role: 'user', timestamp: new Date().toISOString() },
        { content: '错误：失败', role: 'assistant', timestamp: new Date().toISOString() }
      ];
      
      const result = compress(messages, { keepRatio: 0.6 });
      
      assert(result.messages.length <= messages.length, 'Should reduce message count');
      assert(result.stats.original === 5, 'Should track original count');
      assert(result.stats.compressed <= 5, 'Should track compressed count');
    });
    
    it('should handle empty messages', () => {
      const result = compress([]);
      assert.strictEqual(result.messages.length, 0);
      assert(result.summary);
    });
    
    it('should throw error for invalid input', () => {
      assert.throws(() => compress('not an array'), /Messages must be an array/);
    });
  });
});
