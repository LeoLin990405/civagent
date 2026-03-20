/**
 * DiscordMessageGuard - Discord 消息循环防护中间件
 * 
 * Issue #107 完整解决方案
 * 
 * 核心功能:
 * - 消息元数据提取（作者类型、响应深度、@检测）
 * - 响应规则引擎（5 条防护规则）
 * - 会话状态管理（追踪处理状态、消息队列）
 * - 历史消息过滤（清理协调消息）
 * 
 * 使用示例:
 * ```typescript
 * const guard = createDiscordMessageGuard(botUserId);
 * 
 * client.on('messageCreate', async (message) => {
 *   const decision = await guard.handleMessage(message);
 *   
 *   if (decision.allowed) {
 *     // 处理消息
 *     await processMessage(message);
 *     guard.finishProcessing(message.channelId);
 *   } else if (decision.suggestion === 'queue') {
 *     // 加入队列
 *     guard.enqueue(message);
 *   }
 *   // 否则忽略
 * });
 * ```
 */

export {
  MessageMetadataExtractor,
  createMetadataExtractor,
  type MessageMetadata,
  type MetadataExtractorConfig,
} from './MessageMetadataExtractor.js';

export {
  ResponseRuleEngine,
  createRuleEngine,
  type RuleConfig,
  type RuleDecision,
  DEFAULT_RULE_CONFIG,
} from './ResponseRuleEngine.js';

export {
  SessionStateManager,
  createSessionManager,
  type SessionState,
  type CleanMessage,
  type SessionManagerConfig,
  DEFAULT_SESSION_CONFIG,
} from './SessionStateManager.js';

export {
  CleanHistoryManager,
  createHistoryManager,
  type HistoryFilterOptions,
  DEFAULT_FILTER_OPTIONS,
} from './CleanHistoryManager.js';

export {
  DiscordMessageGuard,
  createDiscordMessageGuard,
  type GuardConfig,
  type HandleMessageResult,
} from './DiscordMessageGuard.js';

// 版本信息
export const VERSION = '1.0.0';
export const ISSUE = '#107';
