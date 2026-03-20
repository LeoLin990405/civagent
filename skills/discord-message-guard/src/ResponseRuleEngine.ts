/**
 * ResponseRuleEngine - 响应规则引擎
 * 
 * 根据配置规则判断是否应该响应某条消息：
 * - 规则 1: 只响应用户的直接@
 * - 规则 2: 机器人@限制深度 < maxDepth
 * - 规则 3: 禁止@everyone / @here 触发
 * - 规则 4: 会话处理中时排队
 */

import type { MessageMetadata } from './MessageMetadataExtractor.js';
import type { SessionState } from './SessionStateManager.js';

export interface RuleConfig {
  /** 最大响应深度，默认 3 */
  maxDepth: number;
  
  /** 忽略所有机器人消息，默认 true */
  ignoreBots: boolean;
  
  /** 禁止@everyone 触发，默认 true */
  blockEveryone: boolean;
  
  /** 禁止@here 触发，默认 true */
  blockHere: boolean;
  
  /** 需要直接@才响应，默认 true */
  requireDirectMention: boolean;
  
  /** 忙时排队而不是丢弃，默认 true */
  queueWhenBusy: boolean;
  
  /** 允许白名单机器人协作，默认 [] */
  allowedBotIds?: string[];
}

export const DEFAULT_RULE_CONFIG: RuleConfig = {
  maxDepth: 3,
  ignoreBots: true,
  blockEveryone: true,
  blockHere: true,
  requireDirectMention: true,
  queueWhenBusy: true,
  allowedBotIds: [],
};

export interface RuleDecision {
  /** 是否允许响应 */
  allowed: boolean;
  
  /** 拒绝原因（如果 allowed=false） */
  reason?: string;
  
  /** 建议动作 */
  suggestion?: 'respond' | 'ignore' | 'queue' | 'block';
}

export class ResponseRuleEngine {
  private config: RuleConfig;
  private botUserId: string;
  
  constructor(botUserId: string, config: Partial<RuleConfig> = {}) {
    this.botUserId = botUserId;
    this.config = { ...DEFAULT_RULE_CONFIG, ...config };
  }
  
  /**
   * 判断是否应该响应某条消息
   */
  shouldRespond(
    metadata: MessageMetadata,
    sessionState?: SessionState
  ): RuleDecision {
    // 规则 0: @everyone 直接禁止（最高优先级）
    if (this.config.blockEveryone && metadata.flags.isEveryone) {
      return {
        allowed: false,
        reason: 'Blocked @everyone - prevents snowball effect',
        suggestion: 'block',
      };
    }
    
    // 规则 0b: @here 直接禁止
    if (this.config.blockHere && metadata.flags.isHere) {
      return {
        allowed: false,
        reason: 'Blocked @here - prevents snowball effect',
        suggestion: 'block',
      };
    }
    
    // 规则 1: 机器人消息处理
    if (metadata.authorType === 'bot') {
      // 检查是否在白名单中
      const isAllowedBot = this.config.allowedBotIds?.includes(metadata.authorId);
      
      // 如果是直接@（用户测试触发），允许响应
      if (metadata.flags.isDirectMention) {
        // 仍然检查深度限制
        if (metadata.depth >= this.config.maxDepth) {
          return {
            allowed: false,
            reason: `Max depth exceeded (${metadata.depth} >= ${this.config.maxDepth})`,
            suggestion: 'ignore',
          };
        }
        return {
          allowed: true,
          reason: 'Bot direct mention allowed',
          suggestion: 'respond',
        };
      }
      
      // 白名单机器人允许
      if (isAllowedBot) {
        return {
          allowed: true,
          reason: 'Whitelisted bot',
          suggestion: 'respond',
        };
      }
      
      // 忽略其他机器人消息
      if (this.config.ignoreBots) {
        return {
          allowed: false,
          reason: 'Ignored bot message (ignoreBots=true)',
          suggestion: 'ignore',
        };
      }
    }
    
    // 规则 2: 必须被@才响应（可配置）
    if (this.config.requireDirectMention) {
      const isMentioned = metadata.mentions.includes(this.botUserId);
      
      if (!isMentioned) {
        return {
          allowed: false,
          reason: 'Not directly mentioned (requireDirectMention=true)',
          suggestion: 'ignore',
        };
      }
    }
    
    // 规则 3: 深度限制
    if (metadata.depth >= this.config.maxDepth) {
      return {
        allowed: false,
        reason: `Max depth exceeded (${metadata.depth} >= ${this.config.maxDepth})`,
        suggestion: 'ignore',
      };
    }
    
    // 规则 4: 会话状态检查
    if (sessionState?.isProcessing) {
      if (this.config.queueWhenBusy) {
        return {
          allowed: false,
          reason: 'Session busy, should queue',
          suggestion: 'queue',
        };
      } else {
        return {
          allowed: false,
          reason: 'Session busy, dropping message',
          suggestion: 'ignore',
        };
      }
    }
    
    // 通过所有检查
    return {
      allowed: true,
      reason: 'Passed all rule checks',
      suggestion: 'respond',
    };
  }
  
  /**
   * 获取配置摘要
   */
  getConfigSummary(): Record<string, any> {
    return {
      maxDepth: this.config.maxDepth,
      ignoreBots: this.config.ignoreBots,
      blockEveryone: this.config.blockEveryone,
      blockHere: this.config.blockHere,
      requireDirectMention: this.config.requireDirectMention,
      queueWhenBusy: this.config.queueWhenBusy,
      allowedBotCount: this.config.allowedBotIds?.length ?? 0,
    };
  }
  
  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<RuleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * 创建规则引擎实例的工厂函数
 */
export function createRuleEngine(
  botUserId: string,
  config?: Partial<RuleConfig>
): ResponseRuleEngine {
  return new ResponseRuleEngine(botUserId, config);
}
