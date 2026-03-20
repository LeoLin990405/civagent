/**
 * MessageMetadataExtractor - 消息元数据提取器
 * 
 * 负责从 Discord 消息中提取结构化元数据，包括：
 * - 作者类型（human vs bot）
 * - 响应深度
 * - @everyone / @here 检测
 * - 会话线程 ID
 */

import type { Message } from 'discord.js';

export interface MessageMetadata {
  // 基础信息
  id: string;
  channelId: string;
  authorId: string;
  authorType: 'human' | 'bot';
  timestamp: number;
  
  // 上下文追踪
  threadId: string;
  depth: number;
  inReplyTo: string | null;
  
  // 标记
  flags: {
    isEveryone: boolean;
    isHere: boolean;
    isBotMention: boolean;
    isDirectMention: boolean;
  };
  
  // 原始消息
  content: string;
  mentions: string[];
}

export interface MetadataExtractorConfig {
  botUserId: string;
  maxDepthCalculation?: number;
}

export class MessageMetadataExtractor {
  private botUserId: string;
  private maxDepthCalculation: number;
  
  constructor(config: MetadataExtractorConfig) {
    this.botUserId = config.botUserId;
    this.maxDepthCalculation = config.maxDepthCalculation ?? 10;
  }
  
  /**
   * 从 Discord 消息提取元数据
   */
  extract(message: Message): MessageMetadata {
    const isBot = message.author.bot;
    const mentionsEveryone = message.mentions.everyone;
    const mentionsHere = message.content.includes('@here');
    const mentionsMe = message.mentions.has(this.botUserId);
    
    return {
      id: message.id,
      channelId: message.channelId,
      authorId: message.author.id,
      authorType: isBot ? 'bot' : 'human',
      timestamp: message.createdTimestamp,
      threadId: this.getThreadId(message),
      depth: this.calculateDepth(message),
      inReplyTo: message.reference?.messageId ?? null,
      flags: {
        isEveryone: mentionsEveryone,
        isHere: mentionsHere,
        isBotMention: mentionsMe && isBot,
        isDirectMention: mentionsMe && !isBot,
      },
      content: message.content,
      mentions: message.mentions.users.map(u => u.id),
    };
  }
  
  /**
   * 计算响应深度
   * 
   * 通过回复链计算消息的响应层级：
   * - 用户直接@ = depth 0
   * - 机器人回复用户 = depth 1
   * - 机器人回复机器人 = depth 2+
   */
  private calculateDepth(message: Message): number {
    let depth = 0;
    
    // 如果是回复消息，追踪回复链
    if (message.reference?.messageId) {
      depth = 1;
      
      // 简化实现：通过内容模式估算深度
      // 实际生产中应该 fetch 引用的消息并递归计算
      const coordinationPatterns = [
        /@\w+\s+(你来 | 你处理 | 你负责 | 请处理)/,
        /交给\s*@\w+/,
        /派发给\s*@\w+/,
        /转交\s*@\w+/,
      ];
      
      // 如果内容包含协调模式，增加深度
      if (coordinationPatterns.some(p => p.test(message.content))) {
        depth += 1;
      }
    }
    
    return depth;
  }
  
  /**
   * 生成线程 ID
   * 
   * 使用频道 ID + 根消息 ID 标识一个会话线程
   */
  private getThreadId(message: Message): string {
    if (message.reference?.messageId) {
      return `${message.channelId}:${message.reference.messageId}`;
    }
    return `${message.channelId}:${message.id}`;
  }
  
  /**
   * 快速检测是否应该忽略的消息
   */
  shouldIgnore(metadata: MessageMetadata): boolean {
    // 忽略@everyone 和@here
    if (metadata.flags.isEveryone || metadata.flags.isHere) {
      return true;
    }
    
    // 忽略机器人消息（除非是直接@）
    if (metadata.authorType === 'bot' && !metadata.flags.isDirectMention) {
      return true;
    }
    
    return false;
  }
}

/**
 * 创建提取器实例的工厂函数
 */
export function createMetadataExtractor(botUserId: string): MessageMetadataExtractor {
  return new MessageMetadataExtractor({ botUserId });
}
