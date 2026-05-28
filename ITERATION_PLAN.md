# CivAgent 迭代计划（三方协作）

> 更新日期：2026-05-28 · 当前主线：`main` @ 78ea10e  
> 三方分工：**后端 = Claude Code** · **前端 = antigravity** · **审查 = Codex** · **内容/长推理 = Trae (MiMo)**  
> 禁用规则：任何场景严禁调用 Gemini（包括 judge、sediment、agent 后端）

---

## 现状总览（2026-05-28）

| 分支 | 状态 | 待处理 |
|---|---|---|
| `main` | R1+R3 引擎 + 完整前端；77 测试全绿 | 前端跑沙盒模拟数据；无写 API |
| `feat/r2-backend-eval` | R2 引擎（multi-judge / skill-quality / replay / prompt-bank）✓ | **未合并 main** → R4 首要任务 |
| `feat/r3-engine-event-contract` | R3 测试隔离修复（51 测试，完全隔离）✓ | **未合并 main** → R4 首要任务 |

### 已完成功能清单

- ✅ **R1 引擎**：去 Gemini、并发锁修复、多后端路由（backends.mjs）、结构化事件流（events.mjs）、skill sedimentation
- ✅ **R1 前端**：Dashboard 观战（TerminalPanel + JudgeLeaderboard）+ RegimeBrowser + HistoryExplorer + CodexBrowser
- ✅ **R2 引擎**（在 `feat/r2-backend-eval`）：`multi-judge.mjs`（盲评匿名化 + 多 provider 聚合）、`skill-quality.mjs`（SHA-256 + Jaccard 去重）、`replay.mjs`、`governance-scenarios.json`（10 场景）
- ✅ **R3 事件契约**：`skill` 事件结构化、tournament manifest 结构化 judge 字段、集成测试完全隔离（无真实 CLI 调用）

### 核心缺口

1. **R2 + R3 未合并 main** —— 写 API / 前端 real-data 都依赖这两个先到位
2. **无写 API**：前端无法发起真实对局/锦标赛（目前跑沙盒模拟数据）
3. **Governance scenario 库仅 10 条**，缺中文政体专项场景
4. **`tasks/` 目录**是 R4 各方任务文件 / 审查结论的落地位置

---

## R1–R3 完成状态

| 任务 | 状态 | 备注 |
|---|---|---|
| B1 去 Gemini | ✅ | judge.mjs + sediment 全链路无 gemini |
| B2 并发 bug | ✅ | tournament 直接 spawn run-v5，no global switch |
| B3 多后端路由 | ✅ | backends.mjs，fail-fast 设计 |
| B4 结构化事件流 | ✅ | events.jsonl + meta.json + tournament manifest |
| B5 编排层测试 | ✅ | 51 个集成测试，完全隔离 |
| B6 错误处理 | ✅ | judge 重试 + sediment 失败记录到 meta |
| R2 多裁判盲评 | ✅ (r2 branch) | anonymizePrompt + aggregateJudgements |
| R2 skill 去重 | ✅ (r2 branch) | SHA-256 + Jaccard 0.6 |
| R2 对局回放 | ✅ (r2 branch) | replay.mjs + replayOf lineage |
| R2 prompt-bank | ✅ (r2 branch) | 10 scenarios，待扩充 |
| R3 事件隔离测试 | ✅ (r3 branch) | 无 ~/.civagent 污染，无真实 CLI |
| 前端形态① | ✅ | Dashboard + RegimeBrowser + History |
| 前端形态②③ | 🚧 | 真实数据未接通，无 launch UI |

---

## Round 4 — 「接通 · 写 API · 内容扩充」

**总目标**：从演示系统升级为可真正运行的系统 —— 前端能发起真实锦标赛、看到真实 transcript 流、管理 skill 库；scenario 库扩充到 40+。

### 执行顺序（依赖链）

```
① Codex 审查 feat/r2-backend-eval          ─┐
② Codex 审查 feat/r3-engine-event-contract  ─┤→ 输出 tasks/REVIEW-r4-codex.md
                                             ↓
③ Claude Code: cherry-pick 两分支 → main    ─┐
④ Claude Code: 写 API server               ─┤
                                            ↓ API 可用
⑤ Antigravity: 接通真实数据 + Launch UI    ─┤  （并行）
⑥ Trae (MiMo): 扩充 governance-scenarios  ─┘
```

---

## 各方任务（R4）

> 详细 prompt 见 `tasks/` 目录下对应文件。

---

### Codex 任务（tasks/TASK-r4-codex.md）

审查 feat/r2-backend-eval 与 feat/r3-engine-event-contract，输出合并许可。

**PR-A：feat/r2-backend-eval**（R2 引擎）—— 重点看：
1. `anonymizePrompt`：前缀重叠安全性（`jin-jurchen` vs `jin` 是否截断正确；按降序长度替换）
2. `parseScoreTable`：三种表格格式（单分/三维分/无 Rank 列）是否全覆盖，边界行（分隔线）是否跳过
3. `aggregateJudgements`：空 provider / 空 scores 时的防守逻辑
4. `skill-quality.mjs`：Jaccard 阈值 0.6 是否偏低（可能误杀差异较大的 skill），`normalizeSkill` 是否剥离 provenance banner
5. `replay.mjs`：`replayOf` 字段是否防止重放循环（如果连续 replay 会发生什么）
6. 全仓 `grep -ri gemini engine/ bin/ test/`——确认无残留调用

**PR-B：feat/r3-engine-event-contract**（测试隔离）—— 重点看：
1. `makeFakeBin`：是否覆盖全部真实 CLI（claude/codex/opencode/cc-glm）？有无遗漏
2. HOME 隔离：macOS 上 `os.homedir()` 是否读 `process.env.HOME`（Node.js 18+ 应当是），还是走 `getpwuid`
3. 确定性 tournament 断言（`j.provider === "codex"`, `j.scores[0].score ≈ 9.0`）：这些依赖 fake codex heredoc 格式——heredoc 变量展开是否可能破坏表格
4. 清理逻辑：`finally` 块是否覆盖所有失败路径（尤其 timeout 情况）

**输出格式**（写入 `tasks/REVIEW-r4-codex.md`）：
```markdown
## PR-A（r2-backend-eval）审查结论
### P0（必须修才能合并）
### P1（建议修，本轮内）
### P2（下轮处理）
### 结论：APPROVE / REQUEST_CHANGES

## PR-B（r3-engine-event-contract）审查结论
（同上格式）
```

---

### Claude Code 任务（后端 R4）

**步骤 1：合并 R2 引擎到 main**（Codex APPROVE 后）

cherry-pick 以下文件（只引擎，不含前端回退 diff）：
```
engine/v5/multi-judge.mjs
engine/v5/skill-quality.mjs
engine/v5/replay.mjs
engine/prompts/governance-scenarios.json
test/multi-judge.test.mjs
test/skill-quality.test.mjs
test/replay.test.mjs
bin/civagent  (新增的 --multi-judge / --prompt-bank / replay / skills --stats 部分)
```
验收：`npm test` 全绿，目标 ≥ 90 tests。

**步骤 2：合并 R3 测试隔离到 main**

cherry-pick `test/integration-event-contract.test.mjs`（来自 5697e39）。

**步骤 3：写 API server**（`server/index.mjs`，Node 内置 http，零外部依赖）

端点清单：
```
GET  /api/regimes                    → 57 个 regime 列表（id / name / metadata）
GET  /api/regimes/:id                → 单个 regime 详情
GET  /api/matches                    → 最近 50 条 meta.json 摘要
GET  /api/matches/:id/events         → events.jsonl → JSON 数组
GET  /api/matches/:id/meta           → meta.json
GET  /api/tournaments                → manifest 列表
GET  /api/tournaments/:id/manifest   → 单个 manifest.json
POST /api/tournament                 → {civs, task, backend?, multiJudge?, judgesN?}
                                        → 立即返回 {tournamentId}（异步 spawn）
GET  /api/skills/:regime             → skill 列表 + analyzeSkillsDir 统计
GET  /api/scenarios                  → governance-scenarios.json
```

安全要求：
- 所有路径参数过 `safeResolve`（复用 `engine/v5/events.mjs` 的 SAFE_ID 逻辑）
- POST 体积上限 32 KB；civs 列表最多 8 个；task 最长 2000 字符
- POST /api/tournament 在后台 spawn tournament.mjs，不等结束

**步骤 4：更新 package.json**
```json
"serve":   "node server/index.mjs",
"dev:all": "concurrently \"npm run serve\" \"npm run dev\""
```
（concurrently 如没有就 `npm i -D concurrently`）

验收：`npm run serve` 启动；curl 能打所有 GET 端点；POST /api/tournament 返回 tournamentId 且后台真正跑起来。

---

### Antigravity 任务（tasks/TASK-r4-antigravity.md）

**前提**：API server（步骤 3）可用，vite.config 已代理 `/api → http://localhost:4242`。

**任务 1：接通真实数据**
- `App.tsx`：mount 时 `GET /api/regimes`；拿到数据 → 真实模式，失败 → DEMO 沙盒模式（界面加明显 "DEMO" badge）
- `HistoryExplorer`：轮询 `GET /api/matches`，每条点进去调 `GET /api/matches/:id/events`

**任务 2：Tournament Launcher**（新 component `TournamentLauncher.tsx`）
- 多选 civs：从 `GET /api/regimes` 加载，最多 6 个
- 选 task：文本输入 OR 点"随机"从 `GET /api/scenarios` 随机取一条
- 选 backend：下拉（`native` / `cn:doubao` / `cn:glm`）
- 开关：Multi-Judge（toggle，N = 2）
- 提交 → `POST /api/tournament` → 拿 tournamentId → 切到 Dashboard，开始轮询
- 错误处理：server 不可用时显示明确提示，不崩溃

**任务 3：实时事件流**
- `TerminalPanel` 改为轮询 `GET /api/matches/:id/events` 每 1.5s
- 拿到新事件（seq > lastSeq）追加到本地 state
- 遇 `match_end` 事件 → 停止轮询，显示 "Completed"
- 遇 `skill` 事件 → 在 terminal 底部显示 skill sedimentation badge

**任务 4：Skill Library tab**（新 component `SkillLibrary.tsx`）
- 左栏：regime 列表
- 右栏：`GET /api/skills/:regime`
  - 每条 skill：文件名、frontmatter name、时间、大小
  - 重复组标 ⚠️ Duplicate
  - 顶部 stats badge：total / unique / dup-groups

**约束**：
- TypeScript strict，新代码无 `any`
- loading / error 状态缺一不可
- 不改 CodexBrowser / RegimeBrowser 内部逻辑

**验收**：`npm run dev:all` 启动，手动跑一场 2 文明对局，前端全流程（选 civs → Submit → 看 transcript → 看评分榜）可走通，无 console error。

---

### Trae (MiMo) 任务（tasks/TASK-r4-trae.md）

**目标**：`engine/prompts/governance-scenarios.json` 从 10 条扩充到 40 条，新增 30 条高质量场景。

**分布要求**：
- **中国政体专项 × 10**（以下 topic 各一条）：
  丝绸之路贸易中断、科举制度改革争议、漕运系统崩溃、藩镇割据与中央失控、宦官集团干政、黄河决堤与赈灾、互市与朝贡体系危机、盐铁官营腐败、军功贵族 vs 文官集团权力争夺、皇位继承礼法冲突
- **全球政体通用 × 20**：
  战争融资危机、殖民地独立运动、宗教机构改革、奴隶制废除过渡期动荡、联邦解体与分裂、货币贬值与通胀、继承法中的性别争议、边境贸易城市自治权、海军封锁与外交施压、工业化冲击传统手工业、粮食出口禁令的内外压力、难民潮政策、间谍叛逃与情报危机、教育系统改革阻力、水资源争夺与跨省冲突、军队政变后的合法性重建、债务违约与外债谈判、文化同化政策的抵抗、城市贫困与阶层矛盾、自然灾害后的责任归咎

**格式要求**：
```json
{
  "id": "silk-road-01",
  "category": "economic",
  "prompt": "The primary overland trade route has been severed by a hostile coalition..."
}
```
- `id`：`<kebab-case-topic>-01`，全部小写，用连字符
- `category`：`military` / `political` / `economic` / `social` / `crisis` / `diplomacy` / `internal` / `innovation` 之一
- `prompt`：英文，60–150 字，**不提具体朝代/地名**，通用到任何政体都能回应
- 合并后 JSON 数组共 40 条，格式合法（`JSON.parse` 不报错）

**输出**：直接覆写 `engine/prompts/governance-scenarios.json`。

---

## 技术约束（全轮通用）

| 规则 | 说明 |
|---|---|
| 禁用 Gemini | 任何场景，任何 provider 链 |
| Git 工作流 | PR 前必须 `git fetch + rebase` 再 push，避免分叉 |
| 测试门槛 | `npm test` 全绿才能合并；新模块必须有配套测试 |
| 路径安全 | 所有用户输入路径过 `safeResolve`；禁止 `..` 穿越 |
| 前端类型 | TypeScript strict，新代码无 `any` |
| 写 API 异步 | POST 立即返回 id，后台 spawn，不阻塞 HTTP 响应 |
| 审查顺序 | Codex 出具 APPROVE 才能合并；不合格打回最多 2 轮 |

---

## 里程碑

| 轮次 | 后端 | 前端 | 内容 | 完成标志 |
|---|---|---|---|---|
| **R4** ← 当前 | 合并 R2/R3 + 写 API server | 真实数据 + Launch UI + Skill 库 | 40 scenarios | UI 全流程可跑真实锦标赛 |
| **R5** | Regime 编辑 API + 史实审稿入环 | 在线编辑 regime + skill 管理 | 政体史实修订 top-20 | 控制台全功能管理 |

---

_三方协作单一事实源。各方开工前先读这个文件，完成后在 `tasks/` 留下审查结论或产出路径。_
