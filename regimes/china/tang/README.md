# 唐朝 · 三省六部制 (Tang Dynasty)

> 618-907 AD · Three Departments and Six Ministries

> ⚠️ **ORIGINAL**: This regime is the original configuration from
> [@wanikua](https://github.com/wanikua)'s [AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial).
> Preserved unchanged with full attribution.

## 简介

唐朝（618-907）是中国历史上最辉煌的朝代之一。其三省六部制代表了中国古代中央官制的巅峰。

三省制实现了权力的制衡：
- **中书省**：负责起草诏令（决策层）
- **门下省**：负责审核驳回（审核层）
- **尚书省**：负责执行落实（执行层）

六部各司其职：吏部（人事）、户部（财政）、礼部（礼仪外交）、兵部（军事）、刑部（司法）、工部（工程）。

## Agent 配置

本政体包含 7 个 Agent：

| Agent | 角色 | 职责 |
|---|---|---|
| 司礼监 | 大内总管 | 总管调度、任务分配、协调各部 |
| 兵部 | 尚书 | 软件工程、代码开发、架构设计 |
| 户部 | 尚书 | 财务运营、数据分析、成本管控 |
| 礼部 | 尚书 | 品牌营销、文案创作、社媒运营 |
| 工部 | 尚书 | 运维部署、DevOps、基础设施 |
| 刑部 | 尚书 | 法务合规、合同审查、知识产权 |
| 吏部 | 尚书 | 项目管理、团队协调、任务追踪 |

## 使用方式

```bash
./scripts/switch-regime.sh china/tang
```

## 编排模式

**Checks & Balances (制衡)**: 三省互相制约，中书起草、门下审核、尚书执行。
在 AI 系统中，多个 Agent 通过 `sessions_send` 互相审核，确保输出质量。

## 参考资料

- [原始项目 AI 朝廷](https://github.com/wanikua/boluobobo-ai-court-tutorial)
- [OpenClaw 框架](https://github.com/openclaw/openclaw)
- 维基百科：[三省六部制](https://zh.wikipedia.org/wiki/三省六部)
