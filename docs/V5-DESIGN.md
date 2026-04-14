# CivAgent v5 — Learning Loop (Hermes-Inspired)

## 目标
v4 每局完全无状态。v5 引入 **跨局学习闭环**，让文明随对局积累治理经验。

灵感来源：NousResearch/hermes-agent 的三个核心设计
1. Autonomous skill creation（经验沉淀为可复用 skill）
2. Agent-curated memory（文明专属记忆隔离）
3. Cross-session recall（跨对局调用历史智慧）

## 新增模块（engine/v5/）

### 1. `civ-memory.mjs` — 文明记忆隔离
- 每个 regime 独占 HOME：`~/.civagent/envs/{region}-{id}/`
- 内含 `.claude/` 子目录 → 每个文明有独立的 CLAUDE.md、skills、memory
- 跨局持久化：对局结束后 HOME 保留，下一局同文明自动复用
- 对比 v4：所有 regime 共享当前 $HOME，互相污染

### 2. `skill-sediment.mjs` — 经验沉淀
对局结束后：
```
main CC → 读取 transcript
       → 调用 codex exec 提取「治理经验」
       → 经 gemini -p 审核（避免幻觉/重复）
       → 写入 regimes/<civ>/skills/learned-<YYYY-MM-DD>-<topic>.md
```
skill 文件格式（与 agentskills.io 标准兼容）：
```yaml
---
name: tang-3省6部-草案冲突仲裁
type: learned
civ: china/tang
source_match: 2026-04-14-001
description: 中书省草案与门下省审核冲突时的三轮反驳模板
---
```

### 3. `run-v5.mjs` — 新入口
包装 v4 的 `regime-to-cc.mjs` 输出，在启动 CC 前：
1. 设置 `HOME=~/.civagent/envs/<regime>/`
2. 加载 `regimes/<civ>/skills/*.md` 到 CC skill 列表
3. 对局中所有消息写入 `~/.civagent/transcripts/<match-id>.jsonl`
4. 退出时触发 `skill-sediment.mjs`

## MVP 范围（先验证闭环）
4 个对照文明：
- `china/tang` — checks-and-balances（Opus drafter + Codex reviewer）
- `china/qin` — centralized（单 Opus，无审查）
- `global/athens` — democratic（3 模型并行投票：Opus/Codex/Gemini）
- `global/rome-republic` — checks-and-balances（对照唐朝）

验证指标：连跑 5 局同题目，观察 `skills/learned-*.md` 是否出现重复治理 pattern，和裁判（第三方 Gemini）对「治理质量」打分趋势。

## Agent Teams 编排
创建 team `civagent-v5`：
- `team-lead` (sonnet) — 裁判 + 出题
- `civ-tang` (opus) — 唐朝 coordinator，沉淀 skill 到 china/tang
- `civ-qin` (cc-doubao) — 秦朝 coordinator
- `civ-athens` (gemini) — 雅典 coordinator
- `civ-rome` (codex) — 罗马 coordinator

team-lead 通过 inbox 派发同一题目给 4 个 civ，各自在隔离 HOME 里跑完，回报结果。

## CLI 变更
```bash
civagent run --v5 "题目..."          # 启用学习闭环
civagent skills <regime>            # 查看该文明累积的 skill
civagent match-log                  # 列出历史对局
civagent tournament --civs a,b,c,d  # 启动 Agent Team 对局
```

## 与 v4 的兼容性
v5 是 **opt-in**（`--v5` flag）。不加 flag 时 v4 行为完全保留。
regimes/ 目录结构不变，仅新增 `regimes/<civ>/skills/` 子目录（可选）。

## 路线图
- [x] 设计文档（本文件）
- [ ] `engine/v5/civ-memory.mjs`
- [ ] `engine/v5/skill-sediment.mjs`
- [ ] `engine/v5/run-v5.mjs`
- [ ] `bin/civagent` 增加 `--v5` / `skills` / `match-log` / `tournament`
- [ ] Agent Team `civagent-v5` 配置
- [ ] MVP 5 局测试 + 裁判评分
- [ ] 交叉审查（Gemini + Codex）
- [ ] PR to fork main
