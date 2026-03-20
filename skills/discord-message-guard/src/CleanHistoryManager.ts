/**
 * CleanHistoryManager - 历史消息过滤管理器
 * 
 * 负责过滤 Discord 消息历史，生成适合 LLM 的干净上下文：
 * - 过滤机器人协调消息
 * - 标注消息类型
 * - 提取目标 Agent 信息
 */

import type { MessageMetadata } from './MessageMetadataExtractor.js';
import type { CleanMessage } from './SessionStateManager.js';

export interface HistoryFilterOptions {
  /** 保留机器人协调消息，默认 false */
  keepBotCoordination?: boolean;
  
  /** 最大消息数，默认 20 */
  maxMessages?: number;
  
  /** 只保留用户消息，默认 false */
  userOnly?: boolean;
}

export const DEFAULT_FILTER_OPTIONS: Required<HistoryFilterOptions> = {
  keepBotCoordination: false,
  maxMessages: 20,
  userOnly: false,
};

/**
 * 协调消息模式
 */
const COORDINATION_PATTERNS = [
  { regex: /@(\w+)\s+(你来 | 你处理 | 你负责 | 请处理)/, type: 'delegate' },
  { regex: /交给\s*@(\w+)/, type: 'handoff' },
  { regex: /派发给\s*@(\w+)/, type: 'delegate' },
  { regex: /转交\s*@(\w+)/, type: 'handoff' },
  { regex: /@\w+\s+继续/, type: 'continue' },
  { regex: /@\w+\s+跟进/, type: 'followup' },
];

export class CleanHistoryManager {
  /**
   * 过滤消息历史
   */
  filterMessages(
    messages: MessageMetadata[],
    options: HistoryFilterOptions = {}
  ): CleanMessage[] {
    const opts = { ...DEFAULT_FILTER_OPTIONS, ...options };
    
    return messages
      .slice(-opts.maxMessages)
      .map(msg => this.toCleanMessage(msg, opts))
      .filter((msg): msg is CleanMessage => msg !== null);
  }
  
  /**
   * 将单条消息转换为 CleanMessage
   */
  private toCleanMessage(
    msg: MessageMetadata,
    options: HistoryFilterOptions
  ): CleanMessage | null {
    // 用户消息：总是保留
    if (msg.authorType === 'human') {
      return {
        id: msg.id,
        authorType: 'human',
        content: msg.content,
        role: 'user',
        timestamp: msg.timestamp,
      };
    }
    
    // 如果启用 userOnly，过滤所有机器人消息
    if (options.userOnly) {
      return null;
    }
    
    // 机器人消息：检测是否是协调消息
    const isCoordination = this.isCoordinationMessage(msg.content);
    const targetAgent = this.extractTargetAgent(msg.content);
    
    // 如果是协调消息且不保留，过滤掉
    if (isCoordination && !options.keepBotCoordination) {
      return null;
    }
    
    return {
      id: msg.id,
      authorType: 'bot',
      content: msg.content,
      role: 'assistant',
      timestamp: msg.timestamp,
      metadata: {
        isCoordination,
        targetAgent,
      },
    };
  }
  
  /**
   * 检测是否是协调消息
   */
  isCoordinationMessage(content: string): boolean {
    return COORDINATION_PATTERNS.some(pattern => 
      pattern.regex.test(content)
    );
  }
  
  /**
   * 提取目标 Agent
   */
  extractTargetAgent(content: string): string | undefined {
    for (const pattern of COORDINATION_PATTERNS) {
      const match = content.match(pattern.regex);
      if (match?.[1]) {
        return match[1];
      }
    }
    
    // 通用@提取
    const mentionMatch = content.match(/@(\w+)/);
    if (mentionMatch?.[1]) {
      return mentionMatch[1];
    }
    
    return undefined;
  }
  
  /**
   * 获取协调消息的类型
   */
  getCoordinationType(content: string): string | undefined {
    for (const pattern of COORDINATION_PATTERNS) {
      if (pattern.regex.test(content)) {
        return pattern.type;
      }
    }
    return undefined;
  }
  
  /**
   * 分析消息历史中的协调模式
   */
  analyzeCoordinationPatterns(
    messages: MessageMetadata[]
  ): {
    totalMessages: number;
    coordinationCount: number;
    coordinationRatio: number;
    targetAgents: Record<string, number>;
    types: Record<string, number>;
  } {
    const botMessages = messages.filter(m => m.authorType === 'bot');
    const coordinationMessages = botMessages.filter(m => 
      this.isCoordinationMessage(m.content)
    );
    
    const targetAgents: Record<string, number> = {};
    const types: Record<string, number> = {};
    
    for (const msg of coordinationMessages) {
      const target = this.extractTargetAgent(msg.content);
      if (target) {
        targetAgents[target] = (targetAgents[target] ?? 0) + 1;
      }
      
      const type = this.getCoordinationType(msg.content);
      if (type) {
        types[type] = (types[type] ?? 0) + 1;
      }
    }
    
    return {
      totalMessages: messages.length,
      coordinationCount: coordinationMessages.length,
      coordinationRatio: botMessages.length > 0 
        ? coordinationMessages.length / botMessages.length 
        : 0,
      targetAgents,
      types,
    };
  }
  
  /**
   * 生成 LLM 上下文格式的历史
   */
  toLLMContext(
    messages: MessageMetadata[],
    options: HistoryFilterOptions = {}
  ): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    const cleanMessages = this.filterMessages(messages, options);
    
    return cleanMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }
  
  /**
   * 生成带标注的 LLM 上下文（用于调试）
   */
  toAnnotatedContext(
    messages: MessageMetadata[]
  ): string {
    return messages.map(msg => {
      const prefix = msg.authorType === 'human' ? '👤 USER' : '🤖 BOT';
      const coordMarker = this.isCoordinationMessage(msg.content) 
        ? ' [COORDINATION]' 
        : '';
      const target = this.extractTargetAgent(msg.content);
      const targetMarker = target ? ` → @${target}` : '';
      
      return `${prefix}${coordMarker}${targetMarker}: ${msg.content}`;
    }).join('\n\n');
  }
}

/**
 * 创建历史管理器实例的工厂函数
 */
export function createHistoryManager(): CleanHistoryManager {
  return new CleanHistoryManager();
}
