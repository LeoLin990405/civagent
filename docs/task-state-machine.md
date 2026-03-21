# 任务状态机使用指南

> 解决多 Agent 协作中的信息孤岛、状态黑盒、错误裸奔问题

---

## 🚀 快速开始

### 1. 创建任务

```bash
# 内阁生成 Plan 后，司礼监创建任务
cat > plan.json << 'EOF'
{
  "description": "实现登录 API 并编写文档",
  "steps": [
    {
      "id": 1,
      "agent": "bingbu",
      "task": "实现用户登录 REST API",
      "dependencies": []
    },
    {
      "id": 2,
      "agent": "libu",
      "task": "编写 API 文档",
      "dependencies": [1]
    },
    {
      "id": 3,
      "agent": "duchayuan",
      "task": "代码审查",
      "dependencies": [1]
    }
  ]
}
EOF

node scripts/task-store.js create --id task_20260321_120000 --plan plan.json
```

**输出**：
```
✅ 任务已创建：task_20260321_120000
   步骤数：3
```

---

### 2. 执行步骤 1（兵部）

```bash
# 获取输入（无依赖，直接执行）
node scripts/task-store.js get-input --task task_20260321_120000 --step 1

# 派发任务给兵部
@兵部 实现用户登录 REST API

# 兵部完成后，更新状态
node scripts/task-store.js update \
  --task task_20260321_120000 \
  --step 1 \
  --status completed \
  --output bingbu_output.json
```

**bingbu_output.json**：
```json
{
  "result": "登录 API 已实现",
  "codeLink": "https://github.com/xxx/auth-api",
  "artifacts": ["screenshot.png"],
  "conversation": [...]
}
```

---

### 3. 执行步骤 2（礼部）

```bash
# 获取输入（自动聚合步骤 1 的输出）
node scripts/task-store.js get-input --task task_20260321_120000 --step 2

# 输出：
{
  "taskId": "task_20260321_120000",
  "stepId": 2,
  "agent": "libu",
  "task": "编写 API 文档",
  "upstreamOutputs": {
    "1": {
      "agent": "bingbu",
      "task": "实现用户登录 REST API",
      "output": {
        "result": "登录 API 已实现",
        "codeLink": "...",
        "artifacts": ["screenshot.png"]
      }
    }
  },
  "context": {
    "originalTask": "实现登录 API 并编写文档",
    "totalSteps": 3,
    "currentStep": 2
  }
}

# 派发任务给礼部（带上兵部的输出）
@礼部 基于兵部的以下输出编写 API 文档：
- 代码链接：https://github.com/xxx/auth-api
- 运行截图：[已附加]
- API 响应：{"token": "xxx", "expires": "7d"}

# 如果兵部的对话历史过长（>20 条），先压缩
node scripts/context-compressor.js compress \
  --input bingbu_conversation.json \
  --output compressed.json

# 更新状态
node scripts/task-store.js update \
  --task task_20260321_120000 \
  --step 2 \
  --status completed \
  --output libu_output.json
```

---

### 4. 查询任务进度

```bash
# 用户随时可以查询
@司礼监 进度如何？

# 司礼监执行
node scripts/task-store.js status --task task_20260321_120000
```

**输出**：
```json
{
  "id": "task_20260321_120000",
  "status": "running",
  "progress": "2/3",
  "steps": [
    {
      "id": 1,
      "agent": "bingbu",
      "task": "实现用户登录 REST API",
      "status": "success",
      "duration": "2m 30s"
    },
    {
      "id": 2,
      "agent": "libu",
      "task": "编写 API 文档",
      "status": "success",
      "duration": "45s"
    },
    {
      "id": 3,
      "agent": "duchayuan",
      "task": "代码审查",
      "status": "pending",
      "duration": null
    }
  ]
}
```

---

## 📋 完整工作流

```
┌─────────────────────────────────────────────────────────┐
│ 1. 用户：@司礼监 实现登录 API 并写文档                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. 司礼监 → 内阁：请优化任务，生成 Plan                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. 内阁返回 Plan（3 个步骤，标注依赖关系）                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 4. 司礼监：创建任务                                       │
│    node task-store.js create --id task_XXX --plan ...  │
└──────────────────┬──────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│ 5a. 步骤 1：兵部   │ │ 5b. 步骤 3：都察院 │
│     实现 API      │ │     （依赖步骤 1）  │
│     ↓            │ │                   │
│ 更新状态         │ │ 等待中...          │
│ status=success   │ │                   │
└────────┬────────┘ └────────┬──────────┘
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 6. 步骤 2：礼部                                          │
│    获取输入：node task-store.js get-input ...          │
│    → 自动拿到兵部的输出                                  │
│    编写文档                                              │
│    更新状态：status=success                             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 7. 步骤 3：都察院                                        │
│    获取输入：自动拿到兵部的代码                          │
│    代码审查                                              │
│    更新状态：status=success / revision_required         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 8. 任务完成，汇报用户                                     │
│    node task-store.js status --task task_XXX           │
│    进度：3/3 完成                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 错误处理

### 临时错误（自动重试）

```bash
# 兵部遇到网络错误
node task-store.js update \
  --task task_XXX \
  --step 1 \
  --status failed \
  --error "Network timeout" \
  --error-type transient \
  --retry-count 1

# 司礼监检测到 transient 错误，自动重试
# 最多重试 3 次
```

### 永久错误（打回修改）

```bash
# 都察院审查驳回
node task-store.js update \
  --task task_XXX \
  --step 3 \
  --status revision_required \
  --revision-reason "缺少 rate limiting 实现"

# 司礼监打回兵部修改
@兵部 都察院审查未通过，需要修改：
- 缺少 rate limiting 实现
- 请在 30 分钟内完成修改
```

### 查询失败任务

```bash
# 列出所有失败步骤
node task-store.js list --status failed

# 查看失败详情
node task-store.js status --task task_XXX
# → 显示 error 字段
```

---

## 📊 上下文压缩

### 何时压缩

| 条件 | 阈值 | 动作 |
|------|------|------|
| 消息数 | >20 条 | 压缩讨论过程 |
| Token 数 | >4000 | 生成摘要 |
| 对话时长 | >30 分钟 | 压缩尝试过程 |

### 压缩示例

**原始对话**（50 条消息）：
```
兵部：我在考虑用 JWT 还是 Session...
司礼监：两者各有优劣...
兵部：那用 JWT 吧...
兵部：等等，我试试另一种方案...
兵部：不行，这个方案有问题...
...（45 条讨论和尝试）...
兵部：✅ 完成！代码：[链接]
```

**压缩后**（5 条消息 + 摘要）：
```
[讨论摘要] 涉及主题：JWT vs Session 技术选型；执行操作：实现登录 API，尝试 3 种方案；遇到问题：rate limiting 实现（已解决）。共 50 条消息已压缩为此摘要。

兵部：✅ 完成！代码：[链接]
```

**压缩率**：90%

### 使用命令

```bash
# 压缩对话
node scripts/context-compressor.js compress \
  --input bingbu_conversation.json \
  --output compressed.json

# 输出
{
  "original": { "messageCount": 50, "tokenEstimate": 8000 },
  "compressed": { "messageCount": 6, "tokenEstimate": 800 },
  "compressionRate": "88%",
  "messages": [...],  // 保留的关键消息
  "summary": "[讨论摘要] ..."
}
```

---

## 🎯 最佳实践

### 1. 任务 ID 命名规范

```
task_YYYYMMDD_HHMMSS[_<short_desc>]
例：task_20260321_120000_login_api
```

### 2. Plan 结构

```json
{
  "description": "清晰的任务描述",
  "steps": [
    {
      "id": 1,                    // 唯一 ID
      "agent": "bingbu",          // 执行 Agent
      "task": "具体任务描述",
      "dependencies": [],         // 依赖的步骤 ID
      "human_review": false,      // 是否需要用户确认
      "retry_policy": {           // 重试策略
        "maxRetries": 3,
        "backoff": "exponential"
      }
    }
  ]
}
```

### 3. Output 结构

```json
{
  "result": "一句话总结结果",
  "artifacts": ["文件链接", "截图链接"],
  "codeLink": "GitHub 链接（如有）",
  "logs": "关键日志（如有）",
  "conversation": [...]  // 完整对话（用于压缩）
}
```

### 4. 并行执行

```json
{
  "steps": [
    { "id": 1, "agent": "bingbu", "dependencies": [] },
    { "id": 2, "agent": "hubu", "dependencies": [] },   // 可与步骤 1 并行
    { "id": 3, "agent": "libu", "dependencies": [1] }   // 依赖步骤 1
  ]
}

# 司礼监调度：
# 1. 识别步骤 1 和 2 无依赖 → 同时派发
# 2. 步骤 3 等待步骤 1 完成后派发
```

---

## 📈 监控指标

```bash
# 查看所有任务
node scripts/task-store.js list --limit 50

# 统计
- 总任务数：100
- 成功率：92%
- 平均耗时：5.2min
- 失败分布：兵部 40% / 礼部 20% / 都察院 40%
```

---

## 🔗 相关文档

- [上下文压缩工具](./context-compressor.md)
- [司礼监 identity](../configs/ming-neige/agents/silijian.md)
- [架构审查报告](./architecture-review.md)
