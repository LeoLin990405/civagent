import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseRuleEngine, DEFAULT_RULE_CONFIG } from './ResponseRuleEngine.js';
import type { MessageMetadata } from './MessageMetadataExtractor.js';

describe('ResponseRuleEngine', () => {
  const botUserId = 'bot-123';
  
  function createMetadata(overrides: Partial<MessageMetadata> = {}): MessageMetadata {
    return {
      id: 'msg-1',
      channelId: 'channel-1',
      authorId: 'user-1',
      authorType: 'human',
      timestamp: Date.now(),
      threadId: 'thread-1',
      depth: 0,
      inReplyTo: null,
      flags: {
        isEveryone: false,
        isHere: false,
        isBotMention: false,
        isDirectMention: true,
      },
      content: 'test',
      mentions: [botUserId],
      ...overrides,
    };
  }

  describe('@everyone / @here 防护', () => {
    it('should block @everyone when blockEveryone=true', () => {
      const engine = new ResponseRuleEngine(botUserId, { blockEveryone: true });
      const metadata = createMetadata({
        flags: { isEveryone: true, isHere: false, isBotMention: false, isDirectMention: true },
      });
      
      const decision = engine.shouldRespond(metadata);
      
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('@everyone');
      expect(decision.suggestion).toBe('block');
    });
    
    it('should block @here when blockHere=true', () => {
      const engine = new ResponseRuleEngine(botUserId, { blockHere: true });
      const metadata = createMetadata({
        flags: { isEveryone: false, isHere: true, isBotMention: false, isDirectMention: true },
      });
      
      const decision = engine.shouldRespond(metadata);
      
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('@here');
    });
  });

  describe('机器人消息过滤', () => {
    it('should block bot messages when ignoreBots=true', () => {
      const engine = new ResponseRuleEngine(botUserId, { ignoreBots: true });
      const metadata = createMetadata({
        authorType: 'bot',
        flags: { isEveryone: false, isHere: false, isBotMention: false, isDirectMention: false },
      });
      
      const decision = engine.shouldRespond(metadata);
      
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('ignoreBots');
    });
    
    it('should allow bot direct mention even when ignoreBots=true', () => {
      const engine = new ResponseRuleEngine(botUserId, { ignoreBots: true });
      const metadata = createMetadata({
        authorType: 'bot',
        flags: { isEveryone: false, isHere: false, isBotMention: true, isDirectMention: true },
        depth: 0,
      });
      
      const decision = engine.shouldRespond(metadata);
      
      expect(decision.allowed).toBe(true);
    });
    
    it('should allow whitelisted bot', () => {
      const engine = new ResponseRuleEngine(botUserId, {
        ignoreBots: true,
        allowedBotIds: ['bot-456'],
      });
      const metadata = createMetadata({
        authorId: 'bot-456',
        authorType: 'bot',
      });
      
      const decision = engine.shouldRespond(metadata);
      
      expect(decision.allowed).toBe(true);
    });
  });

  describe('深度限制', () => {
    it('should block when depth >= maxDepth', () => {
      const engine = new ResponseRuleEngine(botUserId, { maxDepth: 3 });
      const metadata = createMetadata({ depth: 3 });
      
      const decision = engine.shouldRespond(metadata);
      
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Max depth exceeded');
    });
    
    it('should allow when depth < maxDepth', () => {
      const engine = new ResponseRuleEngine(botUserId, { maxDepth: 3 });
      const metadata = createMetadata({ depth: 2 });
      
      const decision = engine.shouldRespond(metadata);
      
      expect(decision.allowed).toBe(true);
    });
    
    it('should block bot coordination at maxDepth', () => {
      const engine = new ResponseRuleEngine(botUserId, { maxDepth: 3 });
      const metadata = createMetadata({
        authorType: 'bot',
        depth: 3,
        flags: { isEveryone: false, isHere: false, isBotMention: true, isDirectMention: false },
      });
      
      const decision = engine.shouldRespond(metadata);
      
      expect(decision.allowed).toBe(false);
    });
  });

  describe('直接@要求', () => {
    it('should block when not mentioned and requireDirectMention=true', () => {
      const engine = new ResponseRuleEngine(botUserId, { requireDirectMention: true });
      const metadata = createMetadata({
        mentions: ['other-bot'],
        flags: { isEveryone: false, isHere: false, isBotMention: false, isDirectMention: false },
      });
      
      const decision = engine.shouldRespond(metadata);
      
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Not directly mentioned');
    });
    
    it('should allow when mentioned', () => {
      const engine = new ResponseRuleEngine(botUserId, { requireDirectMention: true });
      const metadata = createMetadata({
        mentions: [botUserId],
        flags: { isEveryone: false, isHere: false, isBotMention: false, isDirectMention: true },
      });
      
      const decision = engine.shouldRespond(metadata);
      
      expect(decision.allowed).toBe(true);
    });
  });

  describe('会话状态检查', () => {
    it('should queue when session is processing and queueWhenBusy=true', () => {
      const engine = new ResponseRuleEngine(botUserId, { queueWhenBusy: true });
      const metadata = createMetadata();
      const sessionState = { isProcessing: true };
      
      const decision = engine.shouldRespond(metadata, sessionState as any);
      
      expect(decision.allowed).toBe(false);
      expect(decision.suggestion).toBe('queue');
    });
    
    it('should ignore when session is processing and queueWhenBusy=false', () => {
      const engine = new ResponseRuleEngine(botUserId, { queueWhenBusy: false });
      const metadata = createMetadata();
      const sessionState = { isProcessing: true };
      
      const decision = engine.shouldRespond(metadata, sessionState as any);
      
      expect(decision.allowed).toBe(false);
      expect(decision.suggestion).toBe('ignore');
    });
  });

  describe('配置管理', () => {
    it('should use default config', () => {
      const engine = new ResponseRuleEngine(botUserId);
      const summary = engine.getConfigSummary();
      
      expect(summary.maxDepth).toBe(3);
      expect(summary.ignoreBots).toBe(true);
      expect(summary.blockEveryone).toBe(true);
      expect(summary.blockHere).toBe(true);
    });
    
    it('should update config', () => {
      const engine = new ResponseRuleEngine(botUserId);
      engine.updateConfig({ maxDepth: 5, ignoreBots: false });
      
      const summary = engine.getConfigSummary();
      expect(summary.maxDepth).toBe(5);
      expect(summary.ignoreBots).toBe(false);
    });
  });

  describe('完整场景测试', () => {
    it('should handle normal user mention', () => {
      const engine = new ResponseRuleEngine(botUserId);
      const metadata = createMetadata();
      
      const decision = engine.shouldRespond(metadata);
      
      expect(decision.allowed).toBe(true);
      expect(decision.suggestion).toBe('respond');
    });
    
    it('should handle bot coordination chain', () => {
      const engine = new ResponseRuleEngine(botUserId, { maxDepth: 3 });
      
      // depth 0: 用户@机器人
      const msg0 = createMetadata({ depth: 0, authorType: 'human' as const });
      expect(engine.shouldRespond(msg0).allowed).toBe(true);
      
      // depth 1: 机器人@机器人
      const msg1 = createMetadata({ depth: 1, authorType: 'bot' as const });
      expect(engine.shouldRespond(msg1).allowed).toBe(true);
      
      // depth 2: 机器人@机器人
      const msg2 = createMetadata({ depth: 2, authorType: 'bot' as const });
      expect(engine.shouldRespond(msg2).allowed).toBe(true);
      
      // depth 3: 应该停止
      const msg3 = createMetadata({ depth: 3, authorType: 'bot' as const });
      expect(engine.shouldRespond(msg3).allowed).toBe(false);
    });
    
    it('should prevent snowball attack', () => {
      const engine = new ResponseRuleEngine(botUserId, {
        blockEveryone: true,
        maxDepth: 3,
        ignoreBots: true,
      });
      
      // @everyone 攻击
      const everyoneMsg = createMetadata({
        flags: { isEveryone: true, isHere: false, isBotMention: true, isDirectMention: true },
      });
      expect(engine.shouldRespond(everyoneMsg).allowed).toBe(false);
      
      // 机器人循环
      const botMsg = createMetadata({
        authorType: 'bot',
        depth: 5,
        flags: { isEveryone: false, isHere: false, isBotMention: true, isDirectMention: false },
      });
      expect(engine.shouldRespond(botMsg).allowed).toBe(false);
    });
  });
});
