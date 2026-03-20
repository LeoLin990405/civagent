/**
 * SessionStateManager - 会话状态管理器
 * 
 * 追踪每个 Discord 频道的会话状态：
 * - 是否正在处理消息
 * - 当前响应深度
 * - 排队消息队列
 * - 过滤后的历史消息
 */

import type { MessageMetadata } from './MessageMetadataExtractor.js';

export interface CleanMessage {
  id: string;
  authorType: 'human' | 'bot';
  content: string;
  role: 'user' | 'assistant';
  timestamp?: number;
  metadata?: {
    isCoordination?: boolean;
    targetAgent?: string;
  };
}

export interface SessionState {
  channelId: string;
  isProcessing: boolean;
  currentDepth: number;
  lastActivity: number;
  messageQueue: MessageMetadata[];
  history: CleanMessage[];
  createdAt: number;
}

export interface SessionManagerConfig {
  /** 空闲超时（毫秒），默认 5 分钟 */
  idleTimeoutMs?: number;
  
  /** 最大历史长度，默认 50 */
  maxHistoryLength?: number;
  
  /** 最大队列长度，默认 10 */
  maxQueueLength?: number;
  
  /** 自动过滤机器人协调消息，默认 true */
  filterBotCoordination?: boolean;
}

export const DEFAULT_SESSION_CONFIG: Required<SessionManagerConfig> = {
  idleTimeoutMs: 5 * 60 * 1000, // 5 分钟
  maxHistoryLength: 50,
  maxQueueLength: 10,
  filterBotCoordination: true,
};

export class SessionStateManager {
  private sessions: Map<string, SessionState> = new Map();
  private config: Required<SessionManagerConfig>;
  private cleanupInterval?: NodeJS.Timeout;
  
  constructor(config: SessionManagerConfig = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    
    // 启动定期清理
    this.startCleanup();
  }
  
  /**
   * 获取会话状态（不存在则创建）
   */
  getState(channelId: string): SessionState {
    if (!this.sessions.has(channelId)) {
      this.sessions.set(channelId, this.createInitialState(channelId));
    }
    return this.sessions.get(channelId)!;
  }
  
  /**
   * 创建初始会话状态
   */
  private createInitialState(channelId: string): SessionState {
    return {
      channelId,
      isProcessing: false,
      currentDepth: 0,
      lastActivity: Date.now(),
      messageQueue: [],
      history: [],
      createdAt: Date.now(),
    };
  }
  
  /**
   * 开始处理消息
   * @returns 是否成功开始（false 表示已在处理）
   */
  startProcessing(channelId: string): boolean {
    const state = this.getState(channelId);
    if (state.isProcessing) {
      return false;
    }
    state.isProcessing = true;
    state.lastActivity = Date.now();
    return true;
  }
  
  /**
   * 完成处理
   */
  finishProcessing(channelId: string): void {
    const state = this.getState(channelId);
    state.isProcessing = false;
    state.currentDepth = 0;
    state.lastActivity = Date.now();
    
    // 处理排队消息（如果有）
    this.processQueue(channelId);
  }
  
  /**
   * 增加响应深度
   */
  incrementDepth(channelId: string): number {
    const state = this.getState(channelId);
    state.currentDepth += 1;
    state.lastActivity = Date.now();
    return state.currentDepth;
  }
  
  /**
   * 获取当前深度
   */
  getCurrentDepth(channelId: string): number {
    return this.getState(channelId).currentDepth;
  }
  
  /**
   * 添加消息到历史
   */
  addToHistory(channelId: string, message: CleanMessage): void {
    const state = this.getState(channelId);
    state.history.push(message);
    
    // 限制历史长度
    if (state.history.length > this.config.maxHistoryLength) {
      state.history = state.history.slice(-this.config.maxHistoryLength);
    }
    
    state.lastActivity = Date.now();
  }
  
  /**
   * 获取过滤后的历史（用于 LLM 上下文）
   */
  getCleanHistory(channelId: string): CleanMessage[] {
    const state = this.getState(channelId);
    
    if (!this.config.filterBotCoordination) {
      return state.history;
    }
    
    // 过滤掉机器人协调消息
    return state.history.filter(msg => {
      // 用户消息总是保留
      if (msg.authorType === 'human') {
        return true;
      }
      
      // 机器人消息：如果是协调消息则过滤
      if (msg.metadata?.isCoordination) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * 添加消息到队列
   * @returns 是否成功添加
   */
  enqueueMessage(channelId: string, metadata: MessageMetadata): boolean {
    const state = this.getState(channelId);
    
    if (state.messageQueue.length >= this.config.maxQueueLength) {
      // 队列已满，丢弃最早的消息
      state.messageQueue.shift();
    }
    
    state.messageQueue.push(metadata);
    state.lastActivity = Date.now();
    return true;
  }
  
  /**
   * 从队列取出下一条消息
   */
  dequeueMessage(channelId: string): MessageMetadata | null {
    const state = this.getState(channelId);
    if (state.messageQueue.length === 0) {
      return null;
    }
    return state.messageQueue.shift()!;
  }
  
  /**
   * 获取队列长度
   */
  getQueueLength(channelId: string): number {
    return this.getState(channelId).messageQueue.length;
  }
  
  /**
   * 处理队列中的下一条消息
   */
  private processQueue(channelId: string): void {
    const state = this.getState(channelId);
    if (state.messageQueue.length > 0 && !state.isProcessing) {
      // 触发下一个排队消息
      // 注意：实际实现中需要回调机制通知上层
      state.lastActivity = Date.now();
    }
  }
  
  /**
   * 检查会话是否空闲
   */
  isIdle(channelId: string): boolean {
    const state = this.getState(channelId);
    return Date.now() - state.lastActivity > this.config.idleTimeoutMs;
  }
  
  /**
   * 获取所有活跃会话
   */
  getActiveSessions(): SessionState[] {
    const now = Date.now();
    return Array.from(this.sessions.values()).filter(
      state => now - state.lastActivity < this.config.idleTimeoutMs
    );
  }
  
  /**
   * 清理空闲会话
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [channelId, state] of this.sessions.entries()) {
      if (now - state.lastActivity > this.config.idleTimeoutMs) {
        this.sessions.delete(channelId);
        cleaned++;
      }
    }
    
    return cleaned;
  }
  
  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    // 每分钟清理一次
    this.cleanupInterval = setInterval(() => {
      const cleaned = this.cleanup();
      if (cleaned > 0) {
        console.log(`[SessionManager] Cleaned ${cleaned} idle sessions`);
      }
    }, 60 * 1000);
  }
  
  /**
   * 停止清理定时器
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    processingSessions: number;
    totalQueued: number;
  } {
    const sessions = Array.from(this.sessions.values());
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => !this.isIdle(s.channelId)).length,
      processingSessions: sessions.filter(s => s.isProcessing).length,
      totalQueued: sessions.reduce((sum, s) => sum + s.messageQueue.length, 0),
    };
  }
}

/**
 * 创建会话管理器实例的工厂函数
 */
export function createSessionManager(
  config?: SessionManagerConfig
): SessionStateManager {
  return new SessionStateManager(config);
}
