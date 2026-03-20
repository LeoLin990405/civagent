/**
 * DiscordMessageGuard - 主集成类
 * 
 * 整合所有组件，提供统一的消息处理接口
 */

import type { Message } from 'discord.js';
import {
  MessageMetadataExtractor,
  type MessageMetadata,
} from './MessageMetadataExtractor.js';
import {
  ResponseRuleEngine,
  type RuleConfig,
  type RuleDecision,
} from './ResponseRuleEngine.js';
import {
  SessionStateManager,
  type SessionManagerConfig,
  type CleanMessage,
} from './SessionStateManager.js';
import {
  CleanHistoryManager,
  type HistoryFilterOptions,
} from './CleanHistoryManager.js';

export interface GuardConfig {
  botUserId: string;
  
  // 规则引擎配置
  rules?: Partial<RuleConfig>;
  
  // 会话管理配置
  session?: Partial<SessionManagerConfig>;
  
  // 历史过滤配置
  history?: Partial<HistoryFilterOptions>;
  
  // 日志回调
  onLog?: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void;
}

export interface HandleMessageResult {
  /** 是否允许处理 */
  allowed: boolean;
  
  /** 决策原因 */
  reason?: string;
  
  /** 建议动作 */
  suggestion: 'process' | 'ignore' | 'queue' | 'block';
  
  /** 消息元数据 */
  metadata?: MessageMetadata;
  
  /** 当前深度 */
  depth?: number;
  
  /** 队列长度 */
  queueLength?: number;
}

export class DiscordMessageGuard {
  private metadataExtractor: MessageMetadataExtractor;
  private ruleEngine: ResponseRuleEngine;
  private sessionManager: SessionStateManager;
  private historyManager: CleanHistoryManager;
  private config: GuardConfig;
  
  constructor(config: GuardConfig) {
    this.config = config;
    
    this.metadataExtractor = new MessageMetadataExtractor({
      botUserId: config.botUserId,
    });
    
    this.ruleEngine = new ResponseRuleEngine(config.botUserId, config.rules);
    
    this.sessionManager = new SessionStateManager(config.session);
    
    this.historyManager = new CleanHistoryManager();
    
    this.log('info', 'DiscordMessageGuard initialized', {
      botUserId: config.botUserId,
      rules: this.ruleEngine.getConfigSummary(),
    });
  }
  
  /**
   * 处理消息（主入口）
   */
  async handleMessage(message: Message): Promise<HandleMessageResult> {
    try {
      // 1. 提取元数据
      const metadata = this.metadataExtractor.extract(message);
      
      this.log('info', 'Message received', {
        id: message.id,
        author: metadata.authorType,
        mentions: metadata.mentions.length,
        depth: metadata.depth,
      });
      
      // 2. 获取会话状态
      const sessionState = this.sessionManager.getState(message.channelId);
      
      // 3. 规则引擎判断
      const decision = this.ruleEngine.shouldRespond(metadata, sessionState);
      
      // 4. 转换为结果
      const result: HandleMessageResult = {
        allowed: decision.allowed,
        reason: decision.reason,
        suggestion: this.mapSuggestion(decision.suggestion ?? 'ignore'),
        metadata,
        depth: metadata.depth,
        queueLength: sessionState.messageQueue.length,
      };
      
      // 5. 根据建议动作处理
      if (!decision.allowed) {
        if (decision.suggestion === 'queue') {
          this.sessionManager.enqueueMessage(message.channelId, metadata);
          this.log('warn', 'Message queued', { 
            channelId: message.channelId,
            queueLength: this.sessionManager.getQueueLength(message.channelId),
          });
        } else if (decision.suggestion === 'block') {
          this.log('error', 'Message blocked', {
            reason: decision.reason,
            metadata,
          });
        } else {
          this.log('info', 'Message ignored', { reason: decision.reason });
        }
      } else {
        this.log('info', 'Message allowed', { 
          suggestion: decision.suggestion,
          depth: metadata.depth,
        });
      }
      
      return result;
      
    } catch (error) {
      this.log('error', 'Error handling message', { error, messageId: message.id });
      return {
        allowed: false,
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'ignore',
      };
    }
  }
  
  /**
   * 开始处理消息（获取锁）
   */
  startProcessing(channelId: string): boolean {
    const success = this.sessionManager.startProcessing(channelId);
    if (success) {
      this.log('info', 'Processing started', { channelId });
    } else {
      this.log('warn', 'Processing already in progress', { channelId });
    }
    return success;
  }
  
  /**
   * 完成处理（释放锁）
   */
  finishProcessing(channelId: string): void {
    this.sessionManager.finishProcessing(channelId);
    this.log('info', 'Processing finished', { channelId });
  }
  
  /**
   * 增加响应深度
   */
  incrementDepth(channelId: string): number {
    const depth = this.sessionManager.incrementDepth(channelId);
    this.log('info', 'Depth incremented', { channelId, depth });
    return depth;
  }
  
  /**
   * 添加消息到历史
   */
  addToHistory(
    channelId: string,
    message: Omit<CleanMessage, 'id'> & { id?: string }
  ): void {
    const cleanMessage: CleanMessage = {
      id: message.id ?? `gen-${Date.now()}`,
      authorType: message.authorType,
      content: message.content,
      role: message.role,
      timestamp: message.timestamp ?? Date.now(),
      metadata: message.metadata,
    };
    
    this.sessionManager.addToHistory(channelId, cleanMessage);
    this.log('info', 'Added to history', { 
      channelId, 
      authorType: message.authorType,
      historyLength: this.sessionManager.getCleanHistory(channelId).length,
    });
  }
  
  /**
   * 获取历史消息（用于 LLM 上下文）
   */
  getHistory(channelId: string): CleanMessage[] {
    return this.sessionManager.getCleanHistory(channelId);
  }
  
  /**
   * 从队列获取下一条消息
   */
  dequeueMessage(channelId: string): MessageMetadata | null {
    return this.sessionManager.dequeueMessage(channelId);
  }
  
  /**
   * 获取会话统计
   */
  getStats(): {
    sessions: {
      total: number;
      active: number;
      processing: number;
      queued: number;
    };
    rules: Record<string, any>;
  } {
    const sessionStats = this.sessionManager.getStats();
    return {
      sessions: {
        total: sessionStats.totalSessions,
        active: sessionStats.activeSessions,
        processing: sessionStats.processingSessions,
        queued: sessionStats.totalQueued,
      },
      rules: this.ruleEngine.getConfigSummary(),
    };
  }
  
  /**
   * 更新规则配置
   */
  updateRules(newRules: Partial<RuleConfig>): void {
    this.ruleEngine.updateConfig(newRules);
    this.log('info', 'Rules updated', newRules);
  }
  
  /**
   * 清理并停止
   */
  destroy(): void {
    this.sessionManager.stop();
    this.log('info', 'DiscordMessageGuard destroyed');
  }
  
  /**
   * 映射建议动作
   */
  private mapSuggestion(suggestion: string): 'process' | 'ignore' | 'queue' | 'block' {
    switch (suggestion) {
      case 'respond':
        return 'process';
      case 'ignore':
        return 'ignore';
      case 'queue':
        return 'queue';
      case 'block':
        return 'block';
      default:
        return 'ignore';
    }
  }
  
  /**
   * 日志记录
   */
  private log(
    level: 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ): void {
    if (this.config.onLog) {
      this.config.onLog(level, message, data);
    } else {
      // 默认日志
      const prefix = `[DiscordMessageGuard:${level.toUpperCase()}]`;
      console.log(prefix, message, data ? JSON.stringify(data) : '');
    }
  }
}

/**
 * 创建 Guard 实例的工厂函数
 */
export function createDiscordMessageGuard(
  botUserId: string,
  config?: Omit<GuardConfig, 'botUserId'>
): DiscordMessageGuard {
  return new DiscordMessageGuard({ botUserId, ...config });
}
