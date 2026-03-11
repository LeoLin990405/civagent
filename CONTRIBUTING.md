# Contributing to CivAgent / 贡献指南

感谢你对 CivAgent 的兴趣！这个项目欢迎所有形式的贡献——尤其是新政体（「MOD」）。

Thank you for your interest in CivAgent! We welcome contributions of all kinds — especially new civilizations ("MODs").

---

## 🎮 贡献新政体 / Adding a New Civilization

这是最有价值的贡献方式。人类历史上有数百种政治制度，我们目前只覆盖了 57 种。

### 1. 生成脚手架

```bash
./scripts/create-regime.sh global/your-empire
# 或 china/your-dynasty
```

这会在 `regimes/` 下创建 5 个模板文件。

### 2. 填写配置文件

| 文件 | 要做什么 | 参考 |
|------|---------|------|
| `metadata.json` | 填写基本信息：名称（中英）、年代、制度、Agent 数量、标签 | 参考 `regimes/china/qin/metadata.json` |
| `openclaw.json.template` | 设计 Agent 架构：定义每个 Agent 的角色、权限、通信关系 | 参考同编排模式的已有政体 |
| `SOUL.md` | 撰写行为准则：语言风格、交互规范、时代特色 | 这是最有创意的部分 |
| `IDENTITY.md` | 绘制组织架构图 + 角色映射表 | ASCII art + Markdown 表格 |
| `README.md` | 撰写 150-300 行的说明文档（7 个板块） | 参考任意已有政体的 README |

### 3. README.md 的 7 个板块

1. **历史背景** — 这个政体在什么历史条件下产生？解决了什么问题？
2. **制度设计** — ASCII 组织架构图 + Agent 角色映射表
3. **编排模式** — 属于 6 种模式中的哪一种？为什么？
4. **与其他政体的对比** — 和哪些政体相似？关键差异是什么？
5. **适用场景** — 什么类型的 AI 任务适合这种编排？
6. **对话示例** — 一段 Agent 之间的模拟对话
7. **学术参考** — 至少 2-3 本核心学术著作

### 4. 验证

```bash
./scripts/validate-regime.sh global/your-empire
```

### 5. 提交 PR

确保：
- [ ] 5 个文件齐全
- [ ] `validate-regime.sh` 通过
- [ ] metadata.json 中英双语
- [ ] README.md 150+ 行，包含 7 个板块
- [ ] 学术参考至少 2-3 本

---

## 6 种编排模式

新政体必须属于以下 6 种模式之一：

| 模式 | 关键特征 | OpenClaw 实现 |
|------|---------|--------------|
| **Centralized Hierarchy** | 单一 main agent 统管 | 单 `main` + `subagents.allowAgents` |
| **Checks & Balances** | 多 top-level agent 互审 | 多 top-level + `sessions_send` |
| **Dual Power** | 两个 main 级交叉审批 | 双 `main` + 重叠 subagents |
| **Federated Autonomy** | 独立 agent 组自治 | 独立组 + 最少通信 |
| **Democratic Council** | 平等 agent 投票 | 等权 agent + 投票机制 |
| **Theocratic** | 绝对权威 main agent | 绝对 `main` + 服从性 subagents |

如果你的政体不完全符合任何一种，选择最接近的，并在 README 中说明差异。

---

## 🐛 报告问题 / Reporting Issues

- **历史错误** — 如果某个政体的历史描述有误，请开 Issue 并引用学术来源
- **配置错误** — JSON 格式问题、缺失字段等
- **脚本 Bug** — switch/list/validate/create 脚本的问题

---

## 📝 改进文档 / Improving Documentation

- 修正错别字和翻译
- 补充参考文献
- 改进 README 的可读性

---

## 🔧 开发规范

- 所有文本内容中英双语
- AI 模型引用使用最新版本
- 不修改 `regimes/china/tang/` —— 这是原作者 @wanikua 的原版配置
- 提交信息使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式

---

## 许可证

贡献代码默认遵循 MIT License。
