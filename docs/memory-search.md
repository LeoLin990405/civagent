# 🧠 语义记忆搜索 — memory-core 配置指南

> ← [返回 README](../README.md) | [📚 文档索引](./README.md)
>
> 适用人群：已搭建好朝廷，想让 AI 真正"记住"过去的事 | 预计耗时：10 分钟
>
> 最终效果：AI 能用语义搜索找到历史笔记，即使你用不同措辞描述同一件事

---

## 📖 目录

1. [为什么需要 Embedding？](#一为什么需要-embedding)
2. [三种方案对比](#二三种方案对比)
3. [方案 A：OpenAI（最省心）](#三方案-aopenai最省心)
4. [方案 B：Google Gemini（免费额度大）](#四方案-bgoogle-gemini免费额度大)
5. [方案 C：DashScope / 通义千问（国内首选）](#五方案-cdashscope--通义千问国内首选)
6. [验证配置](#六验证配置)
7. [进阶配置](#七进阶配置)
8. [常见问题](#八常见问题)

---

## 一、为什么需要 Embedding？

Clawdbot 的记忆系统分两层：

| 层次 | 说明 | 依赖 |
|------|------|------|
| **文件记忆** | `MEMORY.md` + `memory/*.md`，纯文本读写 | ❌ 不需要额外配置 |
| **语义搜索** | 用向量索引搜索记忆，支持模糊匹配 | ✅ **需要 Embedding API** |

文件记忆开箱即用 — AI 每次启动会读当天和昨天的日记。但如果你问"上周讨论的那个部署方案是什么"，纯文本匹配找不到，**语义搜索**才能理解"部署方案"和"Docker 容器化迁移"说的是同一件事。

**没有配置 Embedding = 没有语义记忆搜索。** AI 只能靠关键词精确匹配，大幅降低记忆检索能力。

---

## 二、三种方案对比

| 方案 | 提供商 | 模型 | 价格 | 国内直连 | 推荐场景 |
|------|--------|------|------|:--------:|----------|
| **A** | OpenAI | `text-embedding-3-small` | ~$0.02/百万 token | ❌ 需代理 | 海外服务器 |
| **B** | Google | `gemini-embedding-001` | 免费额度充足 | ❌ 需代理 | 海外 + 想省钱 |
| **C** | 阿里 DashScope | `text-embedding-v3` | ¥0.7/百万 token | ✅ | 🌟 国内服务器首选 |

> 💡 三种方案任选其一，效果差异不大。国内服务器强烈推荐方案 C（DashScope），不用翻墙、便宜、中文效果好。

---

## 三、方案 A：OpenAI（最省心）

**前提：** 你已经有 OpenAI API Key（用于模型调用的那个就行）。

只需确保 `openclaw.json` 中有 OpenAI 的 API Key，Clawdbot 会自动检测并启用：

```json5
{
  "models": {
    "providers": {
      "openai": {
        "apiKey": "sk-xxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

如果你想明确指定（可选）：

```json5
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "openai",
        "model": "text-embedding-3-small"
      }
    }
  }
}
```

重启生效：

```bash
clawdbot gateway restart
```

---

## 四、方案 B：Google Gemini（免费额度大）

**前提：** 有 Google AI Studio 的 API Key。

去 [Google AI Studio](https://aistudio.google.com/apikey) 生成 API Key，然后配置：

```json5
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "gemini",
        "model": "gemini-embedding-001",
        "remote": {
          "apiKey": "AIzaSy-你的GeminiKey"
        }
      }
    }
  }
}
```

或者用环境变量：

```bash
export GEMINI_API_KEY="AIzaSy-你的GeminiKey"
```

重启生效：

```bash
clawdbot gateway restart
```

---

## 五、方案 C：DashScope / 通义千问（国内首选）

DashScope 提供 OpenAI 兼容的 Embedding API，配置为自定义 endpoint 即可。

### 第 1 步：获取 API Key

1. 注册 [阿里云 DashScope](https://dashscope.console.aliyun.com/)
2. 进入控制台 → API-KEY 管理 → 创建 Key
3. 复制保存

### 第 2 步：编辑配置

在 `openclaw.json` 的 `agents.defaults` 中添加 `memorySearch` 配置：

```json5
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "openai",
        "model": "text-embedding-v3",
        "remote": {
          "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1/",
          "apiKey": "sk-你的DashScope-Key",
          "batch": {
            "enabled": false
          }
        }
      }
    }
  }
}
```

**关键配置说明：**

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `provider` | `"openai"` | 使用 OpenAI 兼容协议 |
| `model` | `"text-embedding-v3"` | 通义千问 Embedding 模型（中文效果好） |
| `baseUrl` | DashScope 的 OpenAI 兼容端点 | 注意末尾有 `/` |
| `batch.enabled` | `false` | ⚠️ **必须关闭** — DashScope 不支持 OpenAI Batch API |

### 第 3 步：重启生效

```bash
clawdbot gateway restart
```

---

## 六、验证配置

### 1. 检查状态

```bash
clawdbot memory status --deep
```

正常输出示例：

```
Memory Search (main)
Provider: openai (requested: openai)
Model: text-embedding-v3
Sources: memory
Indexed: 25/25 files · 128 chunks
Dirty: no
Embeddings: ready          ← ✅ 说明 API 连通
Vector: ready              ← ✅ 向量搜索可用
FTS: ready                 ← ✅ 全文搜索可用
```

**排查要点：**

| 状态 | 含义 | 解决方法 |
|------|------|----------|
| `Embeddings: ready` | ✅ API 连通 | — |
| `Embeddings: unavailable` | ❌ API 不通 | 检查 Key 和 baseUrl |
| `Dirty: yes` | 有文件未索引 | 运行 `clawdbot memory index` |
| `Indexed: 0/N files` | 尚未索引 | 运行 `clawdbot memory index` |

### 2. 手动建立索引

```bash
clawdbot memory index --verbose
```

首次索引会处理所有 `memory/` 下的 Markdown 文件，后续只处理变更。

### 3. 测试搜索

```bash
clawdbot memory search "上周的部署讨论"
```

如果返回相关的记忆片段（带文件名和行号），说明语义搜索已正常工作。

### 4. 在对话中验证

直接在 Discord / 飞书中问你的 AI：

```
你记得我之前说的那个关于 xxx 的事吗？
```

AI 会调用 `memory_search` 工具查找相关记忆。

---

## 七、进阶配置

### 混合搜索（BM25 + 向量）

默认已启用。语义搜索 + 关键词搜索联合，兼顾模糊理解和精确匹配：

```json5
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "query": {
          "hybrid": {
            "enabled": true,
            "vectorWeight": 0.7,
            "textWeight": 0.3
          }
        }
      }
    }
  }
}
```

### Embedding 缓存

默认已启用。避免重复计算未变更内容的向量：

```json5
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "cache": {
          "enabled": true,
          "maxEntries": 50000
        }
      }
    }
  }
}
```

### 会话记忆索引（实验性）

把历史会话也纳入搜索范围：

```json5
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "experimental": { "sessionMemory": true },
        "sources": ["memory", "sessions"]
      }
    }
  }
}
```

### 本地 Embedding（离线 / 隐私优先）

不想调 API？可以用本地模型（需要 ~0.6 GB 空间）：

```bash
# 先安装原生依赖
cd /usr/lib/node_modules/clawdbot
pnpm approve-builds   # 选择 node-llama-cpp
pnpm rebuild node-llama-cpp
```

```json5
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "local"
        // 模型会自动下载，也可以手动指定:
        // "local": { "modelPath": "hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf" }
      }
    }
  }
}
```

---

## 八、常见问题

**Q: 不配置 Embedding，AI 还能用吗？**

能用。只是 `memory_search` 工具不可用，AI 只能靠每次启动时读取当天/昨天的日记文件来"记忆"。长期记忆检索会受影响。

**Q: DashScope 为什么要关闭 batch 模式？**

DashScope 的 OpenAI 兼容接口不支持 OpenAI Batch API（`/batches` 端点）。不关闭会导致索引失败。

**Q: 索引后搜索没结果？**

1. 确认 `clawdbot memory status --deep` 显示 `Embeddings: ready`
2. 确认 `Indexed` 文件数 > 0
3. 如果显示 `Dirty: yes`，运行 `clawdbot memory index`
4. 检查 `memory/` 目录下确实有 `.md` 文件

**Q: 换了 Embedding 提供商后需要重新索引吗？**

需要。Clawdbot 会自动检测 provider/model 变更并触发全量重新索引。

**Q: 多个 Agent 可以用不同的 Embedding 吗？**

可以。在 `agents.<agentId>.memorySearch` 中单独配置即可覆盖 `agents.defaults`。

**Q: 费用大概多少？**

记忆文件通常很小。以 100 篇日记（每篇 1000 字）为例：
- OpenAI `text-embedding-3-small`：约 ¥0.01
- DashScope `text-embedding-v3`：约 ¥0.005
- Google Gemini：免费额度内

基本可以忽略不计。

---

> 📖 更多细节参考 Clawdbot 官方文档：[Memory 概念](https://docs.clawd.bot/concepts/memory) | [CLI memory 命令](https://docs.clawd.bot/cli/memory)
