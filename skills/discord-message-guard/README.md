# Discord Message Guard

> Issue #107 完整解决方案 - Discord 消息循环防护中间件

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/wanikua/danghuangshang)
[![Issue](https://img.shields.io/badge/issue-%23107-red.svg)](https://github.com/wanikua/danghuangshang/issues/107)

## 🎯 解决的问题

### Issue #107 症状

1. **机器人消息循环** - 机器人互相@导致无限响应
2. **@everyone 雪崩** - 触发所有机器人同时响应，频道爆炸
3. **会话历史污染** - LLM 无法区分用户指令 vs 机器人协调

### 根本原因

- ❌ 未区分 `human` vs `bot` 消息来源
- ❌ 缺少响应深度限制
- ❌ 无会话状态管理
- ❌ @everyone 无防护机制

---

## 🚀 快速开始

### 安装

```bash
cd /home/ubuntu/danghuangshang/skills/discord-message-guard
npm install
npm run build
```

### 基本使用

```typescript
import { createDiscordMessageGuard } from './dist/index.js';

// 创建 Guard 实例
const guard = createDiscordMessageGuard('YOUR_BOT_USER_ID', {
  rules: {
    maxDepth: 3,           // 最大响应深度
    ignoreBots: true,      // 忽略机器人消息
    blockEveryone: true,   // 禁止@everyone
    blockHere: true,       // 禁止@here
    requireDirectMention: true,
  },
});

// 集成到 Discord 事件
client.on('messageCreate', async (message) => {
  // 1. 检查是否应该处理
  const result = await guard.handleMessage(message);
  
  if (!result.allowed) {
    console.log(`Message blocked: ${result.reason}`);
    return;
  }
  
  // 2. 获取处理锁
  if (!guard.startProcessing(message.channelId)) {
    console.log('Already processing in this channel');
    return;
  }
  
  try {
    // 3. 处理消息
    await processMessage(message);
    
    // 4. 添加到历史
    guard.addToHistory(message.channelId, {
      authorType: 'human',
      content: message.content,
      role: 'user',
    });
    
  } finally {
    // 5. 释放锁
    guard.finishProcessing(message.channelId);
  }
});
```

---

## 📦 核心组件

### 1. MessageMetadataExtractor

提取消息元数据：

```typescript
const extractor = new MessageMetadataExtractor({ botUserId: '123' });
const metadata = extractor.extract(message);

console.log(metadata);
// {
//   authorType: 'human' | 'bot',
//   depth: 0,
//   flags: {
//     isEveryone: false,
//     isDirectMention: true,
//   },
//   ...
// }
```

### 2. ResponseRuleEngine

响应规则引擎（5 条防护规则）：

```typescript
const engine = new ResponseRuleEngine('123', {
  maxDepth: 3,
  ignoreBots: true,
  blockEveryone: true,
});

const decision = engine.shouldRespond(metadata, sessionState);
if (decision.allowed) {
  // 响应消息
} else {
  console.log(`Blocked: ${decision.reason}`);
}
```

### 3. SessionStateManager

会话状态管理：

```typescript
const sessionManager = new SessionStateManager({
  idleTimeoutMs: 5 * 60 * 1000,
  maxHistoryLength: 50,
});

// 获取锁
if (sessionManager.startProcessing(channelId)) {
  // 处理中...
  sessionManager.finishProcessing(channelId);
}
```

### 4. CleanHistoryManager

历史消息过滤：

```typescript
const historyManager = new CleanHistoryManager();

// 过滤协调消息
const cleanHistory = historyManager.filterMessages(messages, {
  keepBotCoordination: false,  // 过滤机器人协调消息
  maxMessages: 20,
});

// 生成 LLM 上下文
const llmContext = historyManager.toLLMContext(messages);
```

---

## ⚙️ 配置选项

### 规则配置 (RuleConfig)

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxDepth` | number | 3 | 最大响应深度 |
| `ignoreBots` | boolean | true | 忽略机器人消息 |
| `blockEveryone` | boolean | true | 禁止@everyone |
| `blockHere` | boolean | true | 禁止@here |
| `requireDirectMention` | boolean | true | 需要直接@ |
| `queueWhenBusy` | boolean | true | 忙时排队 |
| `allowedBotIds` | string[] | [] | 白名单机器人 |

### 会话配置 (SessionManagerConfig)

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `idleTimeoutMs` | number | 300000 | 空闲超时（5 分钟） |
| `maxHistoryLength` | number | 50 | 最大历史长度 |
| `maxQueueLength` | number | 10 | 最大队列长度 |
| `filterBotCoordination` | boolean | true | 过滤协调消息 |

---

## 📊 使用示例

### 完整集成示例

```typescript
import { Client, GatewayIntentBits } from 'discord.js';
import { createDiscordMessageGuard } from './dist/index.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const guard = createDiscordMessageGuard(client.user!.id, {
  rules: {
    maxDepth: 3,
    ignoreBots: true,
    blockEveryone: true,
  },
  onLog: (level, message, data) => {
    console.log(`[${level}] ${message}`, data);
  },
});

client.on('messageCreate', async (message) => {
  // 忽略自己的消息
  if (message.author.id === client.user!.id) {
    return;
  }
  
  // 检查是否应该处理
  const result = await guard.handleMessage(message);
  
  if (!result.allowed) {
    console.log(`❌ ${result.reason}`);
    return;
  }
  
  // 获取处理锁
  if (!guard.startProcessing(message.channelId)) {
    console.log('⏳ Already processing');
    return;
  }
  
  try {
    // 获取历史上下文
    const history = guard.getHistory(message.channelId);
    
    // 调用 LLM
    const response = await callLLM(message.content, history);
    
    // 发送回复
    await message.reply(response);
    
    // 更新历史
    guard.addToHistory(message.channelId, {
      authorType: 'human',
      content: message.content,
      role: 'user',
    });
    
    guard.addToHistory(message.channelId, {
      authorType: 'bot',
      content: response,
      role: 'assistant',
    });
    
    console.log('✅ Message processed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    guard.finishProcessing(message.channelId);
  }
});

client.login('YOUR_BOT_TOKEN');
```

### 监控统计

```typescript
// 定期打印统计
setInterval(() => {
  const stats = guard.getStats();
  console.log('📊 Guard Stats:', stats);
}, 60 * 1000);

// 输出示例:
// 📊 Guard Stats: {
//   sessions: {
//     total: 5,
//     active: 2,
//     processing: 1,
//     queued: 0
//   },
//   rules: {
//     maxDepth: 3,
//     ignoreBots: true,
//     blockEveryone: true,
//     ...
//   }
// }
```

---

## 🧪 测试

```bash
npm test
```

### 单元测试示例

```typescript
import { describe, it, expect } from 'vitest';
import { ResponseRuleEngine } from './ResponseRuleEngine.js';

describe('ResponseRuleEngine', () => {
  it('should block @everyone', () => {
    const engine = new ResponseRuleEngine('bot-123', { blockEveryone: true });
    const metadata = {
      flags: { isEveryone: true },
      depth: 0,
      authorType: 'human' as const,
    };
    
    const decision = engine.shouldRespond(metadata as any);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('@everyone');
  });
  
  it('should block when depth >= maxDepth', () => {
    const engine = new ResponseRuleEngine('bot-123', { maxDepth: 3 });
    const metadata = { depth: 3, authorType: 'bot' as const, flags: {} };
    
    const decision = engine.shouldRespond(metadata as any);
    expect(decision.allowed).toBe(false);
  });
});
```

---

## 📈 效果对比

### 修复前

```
用户：@司礼监 写 API
  ↓
司礼监：@内阁 优化
  ↓
内阁：@兵部 执行
  ↓
兵部：@工部 部署
  ↓
工部：@司礼监 完成
  ↓
司礼监：@内阁...（无限循环）
💥 频道爆炸
```

### 修复后

```
用户：@司礼监 写 API
  ↓
司礼监：@内阁 优化（depth=1）
  ↓
内阁：@兵部 执行（depth=2）
  ↓
兵部：@工部 部署（depth=3）
  ↓
工部：完成（depth=3，不再@）
✅ 正常结束
```

---

## 🔗 相关文档

- [Issue #107](https://github.com/wanikua/danghuangshang/issues/107)
- [架构设计文档](../../docs/architecture-fix-107.md)

---

## 📝 License

MIT
