# 🏛️ 制度选择指南

> ← [返回 README](../README.md)

---

## 📋 三种制度对比

| 维度 | 唐朝三省制 | 明朝内阁制 | 现代企业制 |
|------|-----------|-----------|-----------|
| **响应速度** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **流程严谨** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **学习成本** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **文化门槛** | 中（唐史） | 中（明史） | 低（通用） |
| **国际化** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Agent 数量** | 14 个 | 18 个 | 14 个 |
| **适用场景** | 企业审核 | 个人项目 | 创业团队 |

---

## 📜 唐朝三省六部制（制衡审核）

### 架构图

```
皇帝（你）
  ▼
中书省 ─→ 门下省 ─→ 尚书省 ─→ 六部
(起草)    (审核 + 追问)  (派发)    (执行)
                └─→ 御史台（独立监察）
```

### 核心职责

| 机构 | 角色 | 职责 | 模型 |
|------|------|------|------|
| **中书省** | 中书令 | 起草诏令、方案设计 | Strong |
| **门下省** | 门下侍中 | 审核方案、追问 context | Strong |
| **尚书省** | 尚书令 | 派发任务、追踪进度 | Fast |
| **六部** | 尚书 | 执行具体任务 | Strong/Fast |
| **御史台** | 御史大夫 | 独立代码审查 | Strong |

### 工作流程

```
1. 皇帝："我要做个用户登录功能"

2. ▼ 中书省
   【诏令草案】
   任务：用户登录 API
   方案：POST /api/login，JWT token，bcrypt 加密
   请陛下审阅。

3. ▼ 门下省
   【审核意见】需要补充
   请陛下确认：
   1. 用户表结构？
   2. Token 有效期？
   3. 登录失败如何处理？

4. ▼ 皇帝
   1. users 表 (id/username/password_hash)
   2. 7 天
   3. 返回 401 错误

5. ▼ 门下省
   【审核通过】信息完整，下发尚书省

6. ▼ 尚书省
   【执行派发】
   - @兵部 实现登录 API（2h）
   - @礼部 编写文档（30min）
   - @工部 配置测试环境（30min）

7. ▼ 兵部
   【工作汇报】正在实现 /api/login...
   （2 小时后）
   【完成】代码已提交，PR #42 请御史台审查

8. ▼ 御史台（Webhook 触发）
   【审查报告】
   ⚠️ 建议修改
   1. src/api/login.js:12 - 使用 bcrypt.compare()
   建议修改后合并。
```

### 适用场景

- ✅ 企业级应用（需要多层审核）
- ✅ 严谨流程（金融、医疗等）
- ✅ 团队协作（职责清晰）
- ❌ 快速原型（用明朝内阁制更快）
- ❌ 个人项目（用极简模式更简单）

### 配置路径

```
configs/tang-sansheng/openclaw.json
```

---

## 🏮 明朝内阁制（快速迭代）

### 架构图

```
皇帝（你）
  ▼
司礼监 ─→ 内阁 ─→ 六部
(接旨)    (优化)    (执行)
        └─→ 都察院（自动审查）
```

### 核心职责

| 机构 | 角色 | 职责 | 模型 |
|------|------|------|------|
| **司礼监** | 大内总管 | 接旨、调度、枢纽 | Fast |
| **内阁** | 首辅 | Prompt 优化、Plan 生成 | Strong |
| **六部** | 尚书 | 执行具体任务 | Strong/Fast |
| **都察院** | 左都御史 | 代码审查 | Strong |

### 工作流程

```
1. 皇帝："@司礼监 写个用户登录 API"

2. ▼ 司礼监
   收到，请内阁优化。

3. ▼ 内阁
   【优化后 Prompt】
   任务：实现用户登录 API
   技术栈：Node.js + Express + JWT
   步骤：
   1. 设计 /api/login 接口
   2. 实现密码验证（bcrypt）
   3. 生成 JWT token（7 天有效期）
   4. 返回用户信息

4. ▼ 司礼监
   【派发】@兵部 按内阁方案执行

5. ▼ 兵部
   【工作汇报】正在实现...
   （2 小时后）
   【完成】代码已提交，请都察院审查

6. ▼ 都察院（Webhook 触发）
   【审查报告】✅ 通过，建议合并
```

### 适用场景

- ✅ 个人项目（快速迭代）
- ✅ 开源维护（响应快）
- ✅ 原型开发（MVP）
- ❌ 企业审核（用唐朝三省制更严谨）

### 配置路径

```
configs/ming-neige/openclaw.json
```

---

## 🏢 现代企业制（国际化）

### 架构图

```
CEO（你）
  ▼
┌───────┬───────┬────────┐
CTO     COO     CFO      CMO
↓       ↓       ↓        ↓
工程    运营    财务     市场
产品    销售    人力     客服
质量    数据    法务
```

### 核心职责

| 角色 | 职责 | 模型 |
|------|------|------|
| **Board** | 战略决策、重大审批 | Strong |
| **CEO** | 日常运营、跨部门协调 | Strong |
| **CTO** | 技术战略、架构决策 | Strong |
| **COO** | 运营优化、资源分配 | Fast |
| **CFO** | 财务分析、预算管控 | Strong |
| **CMO** | 品牌营销、增长 | Fast |
| **VP Eng** | 工程交付、代码质量 | Strong |
| **VP Product** | 产品规划、需求管理 | Strong |
| **QA Director** | 质量保障、测试 | Strong |

### 工作流程

```
1. CEO (User): "Build a user login API"

2. ▼ CEO Agent
   【CEO Update】
   Status: On Track
   Assigning to CTO for technical implementation.

3. ▼ CTO
   【Tech Decision】
   Recommendation: Node.js + Express + JWT
   Trade-offs: Fast development, well-supported
   Timeline: 2-3 hours

4. ▼ VP Engineering
   【Engineering Update】
   Task: Implement /api/login
   Progress: 50%
   ETA: 1 hour

5. ▼ QA Director
   【QA Report】
   Test Coverage: 85%
   Critical Issues: 0
   Recommendation: Pass
```

### 适用场景

- ✅ 创业团队（角色清晰）
- ✅ 商业项目（收入导向）
- ✅ 国际化团队（英文沟通）
- ❌ 传统文化爱好者（用唐朝/明朝制）

### 配置路径

```
configs/modern-ceo/openclaw.json
```

---

## 🎯 选择建议

### 不知道选什么？→ **明朝内阁制**

**理由**:
- 默认配置，文档最全
- 响应速度快
- 文化亲近感（中文）

### 需要多层审核？→ **唐朝三省制**

**理由**:
- 门下省专职追问，避免需求不清
- 御史台独立审查，质量保证
- 流程严谨，适合企业

### 国际化团队？→ **现代企业制**

**理由**:
- 英文沟通，无文化门槛
- 角色通用，易于理解
- 商业导向，关注 ROI

---

## 🔄 切换制度

安装后想切换制度？运行：

```bash
# 备份当前配置
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak

# 复制新制度配置
cp configs/tang-sansheng/openclaw.json ~/.openclaw/openclaw.json

# 编辑配置（填入 API Key + Bot Token）
nano ~/.openclaw/openclaw.json

# 重启 Gateway
openclaw gateway restart
```

---

## 📚 历史背景

### 唐朝三省六部制

唐朝（618-907）的三省六部制是中国古代经典政治制度：
- **中书省**：决策机构，起草诏令
- **门下省**：审议机构，审核封驳
- **尚书省**：执行机构，下辖六部
- **御史台**：监察机构，独立向皇帝负责

特点：**三省制衡**，避免权臣专权。

### 明朝内阁制

明朝（1368-1644）废丞相，设司礼监 + 内阁：
- **司礼监**：大内总管，接旨批红
- **内阁**：大学士，票拟优化
- **六部**：执行部门
- **都察院**：监察机构

特点：**二元治理**，司礼监与内阁相互制衡。

### 现代企业制

硅谷创业公司标准架构：
- **Board**：董事会，战略决策
- **CEO**：首席执行官，日常运营
- **C-level**：各管一摊，专业决策

特点：**扁平高效**，快速迭代。

---

**选择困难？** 在 GitHub 提 Issue 或加入 Discord 社区讨论！

- 🐛 [提交 Issue](https://github.com/wanikua/danghuangshang/issues)
- 💬 [Discord 社区](https://discord.gg/clawd)
