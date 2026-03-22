# OpenClaw 2026.3.13 升级指南

> **重要**：OpenClaw 2026.3.13 有配置格式变更，旧配置需要更新！

---

## 🔴 配置格式变更

### 1. API 类型名称变更

**旧格式**：
```json
{
  "api": "openai"
}
```

**新格式**：
```json
{
  "api": "openai-completions"
}
```

**有效的 API 类型**：
- `openai-completions` - OpenAI 补全 API
- `openai-responses` - OpenAI Responses API
- `openai-codex-responses` - OpenAI Codex
- `anthropic-messages` - Anthropic Messages
- `google-generative-ai` - Google Generative AI
- `github-copilot` - GitHub Copilot
- `bedrock-converse-stream` - AWS Bedrock
- `ollama` - Ollama

---

### 2. 已移除的配置键

以下键在 2026.3.13 中**不再支持**，需要从配置中删除：

| 键 | 位置 | 替代方案 |
|---|---|---|
| `maxConcurrent` | `agents.list[].subagents` | 已移除，使用默认并发 |
| `runTimeoutSeconds` | `agents.list[]` | 已移除，使用默认超时 |
| `applicationId` | `channels.discord.accounts[]` | 已移除，使用 Bot Token |
| `_regime` | 根级别 | 已移除，使用 `meta.regime` |

---

## 🔧 升级步骤

### 方式一：使用安装脚本（推荐）

```bash
# 新版本安装脚本会自动生成兼容配置
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/scripts/full-install.sh)
```

### 方式二：手动更新现有配置

```bash
cd ~/.openclaw

# 1. 备份旧配置
cp openclaw.json openclaw.json.bak

# 2. 删除不兼容的键
# 使用文本编辑器或以下命令：
sed -i '/"maxConcurrent":/d' openclaw.json
sed -i '/"applicationId":/d' openclaw.json
sed -i '/"_regime":/d' openclaw.json

# 3. 更新 API 类型
# 将 "api": "openai" 改为 "api": "openai-completions"

# 4. 重启 Gateway
openclaw gateway restart
```

### 方式三：使用 Doctor 自动修复

```bash
# OpenClaw Doctor 会自动修复部分配置问题
openclaw doctor

# 然后重启
openclaw gateway restart
```

---

## 📋 完整配置示例

### Anthropic 配置（推荐）

```json
{
  "meta": {
    "regime": "ming-neige",
    "name": "明朝内阁制"
  },
  "models": {
    "providers": {
      "anthropic": {
        "baseUrl": "https://api.anthropic.com",
        "apiKey": "YOUR_ANTHROPIC_API_KEY",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-sonnet-4-5",
            "name": "Claude Sonnet 4.5",
            "input": ["text", "image"],
            "contextWindow": 200000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "gateway": {
    "mode": "local",
    "port": 18789
  },
  "agents": {
    "defaults": {
      "workspace": "/home/ubuntu/clawd",
      "model": {
        "primary": "anthropic/claude-sonnet-4-5"
      },
      "sandbox": {
        "mode": "non-main"
      }
    },
    "list": [
      {
        "id": "silijian",
        "label": "司礼监",
        "model": {
          "primary": "anthropic/claude-sonnet-4-5"
        }
      }
    ]
  },
  "channels": {
    "discord": {
      "enabled": true,
      "accounts": {
        "default": {
          "botToken": "YOUR_BOT_TOKEN"
        }
      }
    }
  }
}
```

---

## ❌ 常见错误及修复

### 错误 1: Invalid option: expected one of "openai-completions"|...

**原因**：使用了旧的 API 类型名称

**修复**：
```json
// ❌ 错误
"api": "openai"

// ✅ 正确
"api": "openai-completions"
```

---

### 错误 2: Unrecognized key: "maxConcurrent"

**原因**：使用了已移除的配置键

**修复**：删除该键
```bash
sed -i '/"maxConcurrent":/d' ~/.openclaw/openclaw.json
```

---

### 错误 3: Unrecognized key: "applicationId"

**原因**：Discord 配置格式变更

**修复**：删除 `applicationId`，使用 `botToken`
```json
// ❌ 错误
{
  "applicationId": "123456789",
  "botToken": "..."
}

// ✅ 正确
{
  "botToken": "..."
}
```

---

### 错误 4: Unrecognized key: "_regime"

**原因**：根级别的 `_regime` 已移除

**修复**：使用 `meta.regime`
```json
// ❌ 错误
{
  "_regime": "ming-neige"
}

// ✅ 正确
{
  "meta": {
    "regime": "ming-neige"
  }
}
```

---

## 🧪 验证升级

```bash
# 1. 检查配置
openclaw doctor

# 2. 重启 Gateway
openclaw gateway restart

# 3. 查看状态
openclaw status

# 4. 测试连接
openclaw gateway --verbose
```

---

## 📞 获取帮助

如果升级遇到问题：

1. **查看日志**：`openclaw gateway logs`
2. **运行 Doctor**：`openclaw doctor`
3. **查看文档**：`https://docs.openclaw.ai`
4. **GitHub Issues**：`https://github.com/openclaw/openclaw/issues`

---

## 🔄 版本兼容性

| OpenClaw 版本 | 配置格式 | 状态 |
|--------------|---------|------|
| 2026.3.13 | v2 | ✅ 当前版本 |
| 2026.2.x | v1 | ⚠️ 需要升级 |
| 2025.x | v0 | ❌ 不兼容 |

---

**最后更新**：2026-03-22  
**适用版本**：OpenClaw 2026.3.13
