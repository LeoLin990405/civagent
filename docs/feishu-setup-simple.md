# 飞书配置指南

## 🚀 快速开始（推荐）

### 单 Bot 模式 - 5 分钟搞定

**只需创建 1 个飞书应用！**

#### Step 1: 创建飞书应用

1. 访问 https://open.feishu.cn/app
2. 创建企业应用，名称：`AI 朝廷`
3. 复制 App ID 和 App Secret

#### Step 2: 配置权限

批量导入以下权限：
```json
{
  "scopes": {
    "tenant": [
      "im:message",
      "im:message:send_as_bot",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:chat.members:bot_access"
    ]
  }
}
```

#### Step 3: 配置事件订阅

1. 启用事件订阅
2. 选择 **WebSocket 长连接**
3. 添加事件：`im.message.receive_v1`

#### Step 4: 发布应用

1. 创建版本
2. 提交审核
3. 等待发布

#### Step 5: 配置 OpenClaw

```bash
cd ~/.openclaw
nano openclaw.json
```

填入你的 App ID 和 App Secret：
```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "accounts": {
        "main": {
          "appId": "cli_xxx",
          "appSecret": "xxx"
        }
      }
    }
  }
}
```

#### Step 6: 重启 Gateway

```bash
openclaw gateway restart
```

#### Step 7: 测试

在飞书里找到 `AI 朝廷` Bot，发送消息测试。

---

## 📚 多 Bot 模式（可选）

如果需要直接@各部门，可以使用多 Bot 模式。

需要创建 9-11 个飞书应用，配置较复杂。

详见：`docs/feishu-multi-bot.md`

---

## ❓ 单 Bot 模式如何使用？

**所有消息都通过司礼监处理**：

- 用户 → @司礼监 → 司礼监内部调度 → 各部门
- 用户无需关心内部流转
- 司礼监会自动@相关部门

**示例**：
```
用户：@司礼监 帮我写个 API
司礼监：收到，已派发给兵部处理
@兵部 开始编写 API 代码...
```

---

## 🎯 推荐

**普通用户**：使用单 Bot 模式（5 分钟搞定）
**高级用户**：使用多 Bot 模式（功能完整）
