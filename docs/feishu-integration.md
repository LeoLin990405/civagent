# 📘 飞书集成指南

> ← [返回制度选择](./regimes.md) | [返回 README](../README.md)

---

## 📋 概述

本项目支持**飞书（Feishu）**作为消息通道，与 Discord 并列可选。

**特点**:
- ✅ 企业微信/钉钉风格，国内团队友好
- ✅ 支持文本、图片、文件消息
- ✅ 群聊机器人、私聊机器人
- ✅ 无需翻墙，国内访问快

---

## 🔧 配置步骤

### 1️⃣ 创建飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 登录企业账号（或个人认证）
3. 点击「创建应用」
4. 填写应用信息：
   - 应用名称：如「AI 朝廷 - 兵部」
   - 应用图标：可选
   - 应用描述：AI 助手

### 2️⃣ 配置机器人能力

1. 进入应用管理页面
2. 点击「添加能力」 → 「机器人」
3. 配置机器人：
   - 机器人名称：如「兵部尚书」
   - 机器人头像：可选
   - 消息类型：文本、图片、文件

### 3️⃣ 获取凭证

1. 在「凭证与基础信息」页面
2. 记录：
   - **App ID**（cli_xxxxxxxxxxxxxxxx）
   - **App Secret**（xxxxxxxxxxxxxxxx）

### 4️⃣ 配置事件订阅

1. 进入「事件订阅」页面
2. 开启事件订阅
3. 配置订阅地址（稍后在 openclaw.json 中填写）
4. 订阅以下事件：
   - `im.message.receive_v1` — 接收消息
   - `im.message.read_v1` — 消息已读（可选）

### 5️⃣ 配置权限

1. 进入「权限管理」页面
2. 添加以下权限：
   - `im:message` — 发送和接收消息
   - `im:chat` — 获取群聊信息
   - `contact:user` — 获取用户信息（可选）

### 6️⃣ 发布应用

1. 点击「版本管理与发布」
2. 创建新版本
3. 提交审核（通常 1-2 个工作日）
4. 审核通过后即可使用

---

## ⚙️ 配置 openclaw.json

### 唐朝三省制示例

编辑 `~/.openclaw/openclaw.json`：

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "dmPolicy": "open",
      "groupPolicy": "open",
      "allowBots": "mentions",  // ✅ 只响应被 @ 的 Bot，防止消息循环
      "accounts": {
        "zhongshu": {
          "appId": "cli_xxxxxxxxxxxxxxxx",
          "appSecret": "xxxxxxxxxxxxxxxx",
          "name": "中书省",
          "groupPolicy": "open"
        },
        "menxia": {
          "appId": "cli_xxxxxxxxxxxxxxxx",
          "appSecret": "xxxxxxxxxxxxxxxx",
          "name": "门下省",
          "groupPolicy": "open"
        },
        "shangshu": {
          "appId": "cli_xxxxxxxxxxxxxxxx",
          "appSecret": "xxxxxxxxxxxxxxxx",
          "name": "尚书省",
          "groupPolicy": "open"
        },
        "bingbu": {
          "appId": "cli_xxxxxxxxxxxxxxxx",
          "appSecret": "xxxxxxxxxxxxxxxx",
          "name": "兵部",
          "groupPolicy": "open"
        }
      }
    }
  },
  "bindings": [
    {
      "agentId": "zhongshu",
      "match": {
        "channel": "feishu",
        "accountId": "zhongshu"
      }
    },
    {
      "agentId": "menxia",
      "match": {
        "channel": "feishu",
        "accountId": "menxia"
      }
    },
    {
      "agentId": "shangshu",
      "match": {
        "channel": "feishu",
        "accountId": "shangshu"
      }
    },
    {
      "agentId": "bingbu",
      "match": {
        "channel": "feishu",
        "accountId": "bingbu"
      }
    }
  ]
}
```

### 明朝内阁制示例

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "accounts": {
        "silijian": {
          "appId": "cli_xxxxxxxxxxxxxxxx",
          "appSecret": "xxxxxxxxxxxxxxxx",
          "name": "司礼监"
        },
        "neige": {
          "appId": "cli_xxxxxxxxxxxxxxxx",
          "appSecret": "xxxxxxxxxxxxxxxx",
          "name": "内阁"
        },
        "bingbu": {
          "appId": "cli_xxxxxxxxxxxxxxxx",
          "appSecret": "xxxxxxxxxxxxxxxx",
          "name": "兵部"
        }
      }
    }
  },
  "bindings": [
    {"agentId": "silijian", "match": {"channel": "feishu", "accountId": "silijian"}},
    {"agentId": "neige", "match": {"channel": "feishu", "accountId": "neige"}},
    {"agentId": "bingbu", "match": {"channel": "feishu", "accountId": "bingbu"}}
  ]
}
```

### 现代企业制示例

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "accounts": {
        "ceo": {
          "appId": "cli_xxxxxxxxxxxxxxxx",
          "appSecret": "xxxxxxxxxxxxxxxx",
          "name": "CEO"
        },
        "cto": {
          "appId": "cli_xxxxxxxxxxxxxxxx",
          "appSecret": "xxxxxxxxxxxxxxxx",
          "name": "CTO"
        },
        "eng": {
          "appId": "cli_xxxxxxxxxxxxxxxx",
          "appSecret": "xxxxxxxxxxxxxxxx",
          "name": "Engineering"
        }
      }
    }
  },
  "bindings": [
    {"agentId": "ceo", "match": {"channel": "feishu", "accountId": "ceo"}},
    {"agentId": "cto", "match": {"channel": "feishu", "accountId": "cto"}},
    {"agentId": "eng", "match": {"channel": "feishu", "accountId": "eng"}}
  ]
}
```

---

## 🚀 启动 Gateway

配置完成后，重启 Gateway：

```bash
openclaw gateway restart
```

查看日志确认飞书通道启动成功：

```bash
openclaw gateway logs | grep feishu
```

---

## 💬 使用示例

### 私聊模式

在飞书中直接私聊机器人：

```
你：@中书省 帮我写个登录 API

中书省：收到，陛下。正在起草诏令...
```

### 群聊模式

1. 邀请机器人进入群聊
2. 在群里@机器人：

```
你：@兵部 这个 API 怎么写？

兵部：陛下，建议使用 RESTful 风格...
```

---

## 🔌 增强功能（可选）

### 安装 ClawHub 飞书 Skill

提供更多功能（群聊管理、图片消息、文件上传）：

```bash
clawdhub install jypjypjypjyp/feishu-messaging
```

### 配置 Webhook

用于御史台代码审查通知：

```json
{
  "gateway": {
    "webhooks": {
      "enabled": true,
      "endpoints": [
        {
          "path": "/webhook/yushitai",
          "agentId": "yushitai",
          "action": "review",
          "notify": {
            "channel": "feishu",
            "accountId": "yushitai"
          }
        }
      ]
    }
  }
}
```

---

## ⚠️ 常见问题

### Q1: 飞书机器人收不到消息？

**检查**:
1. 事件订阅是否开启
2. 权限是否配置正确
3. `im:message` 权限是否添加
4. 应用是否已发布（审核通过）

### Q2: 机器人无法@成员？

**检查**:
1. 群聊权限是否开启
2. `contact:user` 权限是否添加
3. 机器人是否在群里

### Q3: 图片消息发送失败？

**解决**:
- 安装 ClawHub 飞书 Skill
- 检查图片大小（<10MB）
- 使用 base64 或 URL 格式

---

## 📚 参考链接

- [飞书开放平台文档](https://open.feishu.cn/document/ukTMukTMukTM/uEjNwUjLxYDM14SM2ATN)
- [OpenClaw 飞书通道配置](https://github.com/openclaw/openclaw)
- [ClawHub 飞书 Skill](https://clawhub.com)

---

**有问题？** 在 GitHub 提 Issue 或加入 Discord 社区讨论！

- 🐛 [提交 Issue](https://github.com/wanikua/danghuangshang/issues)
- 💬 [Discord 社区](https://discord.gg/clawd)
