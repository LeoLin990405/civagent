# Discord 安全配置指南

> ⚠️ **重要：防止机器人无限循环**
> 
> 错误配置会导致所有机器人陷入消息循环，频道报废。请务必按本文档配置。

---

## 🚨 核心问题：Issue #107

**现象**：
1. 机器人互相 @ 后，开始重复前一个机器人的回答
2. 机器人"学会了@"，主动 @ 其他机器人
3. 使用 `@everyone` 后，频道无限循环，所有机器人互相 @，频道报废

**根本原因**：三个配置叠加形成死循环

---

## ✅ 安全配置（复制即用）

### 1. `allowBots` 设置（最关键）

在 `openclaw.json` 的 `channels.discord` 中：

```json
{
  "channels": {
    "discord": {
      "allowBots": "mentions"
    }
  }
}
```

**三个选项对比**：

| 值 | 行为 | 安全性 |
|---|---|---|
| `"mentions"` | 只响应**明确 @自己**的 bot 消息 | ✅ **推荐** |
| `true` | 响应所有 bot 消息（包括其他 bot 的回复） | ❌ **危险** - 会导致循环 |
| `false` | 完全忽略所有 bot 消息 | ⚠️ 安全但多 bot 协作失效 |

**为什么 `"mentions"` 是最佳平衡**：
- ✅ 司礼监 @ 兵部 → 兵部响应（协作正常）
- ✅ 兵部回复 → 不触发司礼监（没 @，不循环）
- ✅ 避免消息循环，保留多 bot 协作能力

---

### 2. `mentionPatterns` 设置（核弹开关）

在 `messages.groupChat` 中：

```json
{
  "messages": {
    "groupChat": {
      "mentionPatterns": []
    }
  }
}
```

**⚠️ 绝对不要使用**：
```json
// ❌ 危险配置 - 会导致雪崩
{
  "mentionPatterns": ["@everyone", "@here"]
}
```

**为什么 `@everyone` 是核弹**：
1. 用户发送 `@everyone`
2. 所有 10+ 个 bot 同时认为自己被提到
3. 所有 bot 同时回复
4. 每个 bot 的回复又触发其他 bot
5. 5 轮后：10 × 3^5 = **2430 条消息**，频道报废

---

### 3. `ignoreOtherMentions` 设置（额外保险）

在 `channels.discord.guilds` 中：

```json
{
  "channels": {
    "discord": {
      "guilds": {
        "YOUR_SERVER_ID": {
          "requireMention": true,
          "ignoreOtherMentions": true
        }
      }
    }
  }
}
```

**作用**：bot 只响应 @自己的消息，@别人的消息一律忽略。

---

## 📋 完整安全配置模板

```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "allowBots": "mentions",
      "groupPolicy": "allowlist",
      "guilds": {
        "YOUR_SERVER_ID": {
          "requireMention": true,
          "ignoreOtherMentions": true,
          "users": ["YOUR_USER_ID"]
        }
      }
    }
  },
  "messages": {
    "groupChat": {
      "mentionPatterns": []
    }
  }
}
```

---

## 🔍 安全检查清单

在启动/更新后，运行以下检查：

```bash
# 1. 检查 allowBots 设置
grep -A 5 '"discord"' ~/.openclaw/openclaw.json | grep allowBots

# 预期输出： "allowBots": "mentions"

# 2. 检查 mentionPatterns
grep -A 3 'mentionPatterns' ~/.openclaw/openclaw.json

# 预期输出： "mentionPatterns": []

# 3. 检查是否有 @everyone 残留
grep -r '@everyone' ~/.openclaw/ ~/clawd/configs/

# 预期输出：无
```

---

## 🛠️ 故障排查

### 症状 1：机器人开始互相回复

**可能原因**：`allowBots` 设成了 `true`

**修复**：
```bash
# 修改配置
openclaw config set channels.discord.allowBots '"mentions"' --json

# 重启 gateway
openclaw gateway restart
```

### 症状 2：@everyone 后频道爆炸

**立即措施**：
1. 手动暂停所有 bot（关闭 gateway）
2. 清理 Discord 频道（删除循环消息）
3. 按本文档修改配置
4. 重启 gateway

**预防**：永远不要在配置中包含 `@everyone` 或 `@here`

### 症状 3：多 bot 协作失效

**可能原因**：`allowBots` 设成了 `false`

**修复**：改为 `"mentions"` 而不是 `false`

---

## 📚 最佳实践

### 1. 人类用户如何 @所有 bot

不要用 `@everyone`，改用：
- 逐个 @需要的 bot
- 或者只 @司礼监，由司礼监内部分发

### 2. Bot 间协作的正确方式

```
用户 → @司礼监 → 司礼监 @兵部 → 兵部执行
                      ↓
                  兵部回复（不 @任何人）
                      ↓
                  司礼监看到回复，继续调度
```

**关键**：bot 回复时不要 @其他 bot，让司礼监负责调度。

### 3. 定期安全审计

每次更新/修改配置后运行：
```bash
~/clawd/scripts/pre-update-check.sh
```

---

## 🔗 相关文档

- [Issue #107 讨论](https://github.com/wanikua/danghuangshang/issues/107)
- [OpenClaw Discord 文档](https://docs.openclaw.ai/channels/discord)
- [配置参考](https://docs.openclaw.ai/gateway/configuration-reference)

---

**最后提醒**：配置完成后，先用小号/测试频道验证，确认无循环后再用于生产频道。
