# 三省流程：内阁前置 + 都察院后置

> ← [返回 README](../README.md) | [架构详解](./architecture.md)

---

## 流程总览

```
用户下旨 → 司礼监接旨 → 内阁（前置优化）→ 司礼监（调度派活）→ 六部执行 → push → 都察院（后置审查）
                              ↑                                                        │
                              └──── 如缺 context，追问用户 ────────────────────────────────┘
                                                                              如有 bug，打回修改
```

## 一、内阁前置优化（自动）

### 触发条件
用户 @司礼监 下达任务（非闲聊/非简单问答）

### 流程
1. **司礼监** 收到任务，自动 `sessions_send` 转发给 **内阁**
2. **内阁** 分析需求：
   - ✅ 需求明确 → 输出优化后的 Prompt + 执行计划（标注派给哪个部门）
   - ❓ 需求模糊 → 列出需补充的问题，返回司礼监
3. **司礼监** 如需补充 → 追问用户 → 拿到后再次发给内阁
4. **司礼监** 拿到内阁的优化结果后，在频道内 @对应部门 派发

### 跳过内阁的情况
- 纯闲聊、简单问答
- 状态查询（git status、系统状态等）
- 紧急 hotfix（需标注跳过原因）

## 二、都察院后置审查（自动）

### 触发条件
代码 push 到 `main` 分支（自动排除纯文档变更）

### 流程
1. GitHub Action 检测到 push
2. 自动生成 diff，通过 OpenClaw API 发送给 **都察院**
3. **都察院** 审查：安全漏洞、性能问题、逻辑错误、代码规范
4. 审查结论发送到 Discord 频道：
   - ✅ 通过
   - ⚠️ 建议修改（列出问题和建议）
   - ❌ 必须修改（列出问题、行号、修复方案）

### 配置步骤

在 GitHub 仓库设置 3 个 Secrets（Settings → Secrets and variables → Actions）：

| Secret 名称 | 说明 | 示例 |
|---|---|---|
| `OPENCLAW_API_URL` | 你的 OpenClaw Gateway 地址 | `http://你的服务器IP:18789` |
| `OPENCLAW_API_TOKEN` | Gateway 的 admin token | 在 `openclaw.json` 的 `gateway.adminToken` 中设置 |
| `DUCHAYUAN_DISCORD_CHANNEL` | 审查报告发送的 Discord 频道 ID | `1234567890` |

> ⚠️ Gateway 需要能从公网访问（或使用 Tailscale/Cloudflare Tunnel）。
> 如果 Gateway 在内网，可以用 [smee.io](https://smee.io) 或 Cloudflare Tunnel 转发。

## 三、完整示例

```
用户：@司礼监 帮我写一个用户登录功能

司礼监 → [sessions_send 给内阁]
       「用户需求：写一个用户登录功能，请优化 Prompt 并生成执行计划」

内阁 → [返回给司礼监]
       「需要补充：1. 技术栈（React/Vue？）2. 认证方式（JWT/Session？）3. 是否需要第三方登录？」

司礼监 → [追问用户]
       「内阁需要确认几个问题：1. 技术栈？ 2. 认证方式？ 3. 第三方登录？」

用户：React + JWT，不需要第三方登录

司礼监 → [再次发给内阁]

内阁 → [返回优化结果]
       「【优化后 Prompt】...
        【执行计划】
        Step 1: @兵部 — 实现 JWT 认证后端 API
        Step 2: @兵部 — 实现 React 登录页面组件
        Step 3: @都察院 — push 后自动审查」

司礼监 → [在频道派活]
       「@兵部 【任务】实现用户登录功能...」

兵部 → [执行 + push]

GitHub Action → [自动触发都察院]

都察院 → [审查报告]
       「✅ commit abc1234 审查通过，无安全问题。建议：密码哈希可考虑用 argon2 替代 bcrypt。」
```
