---
name: novel-openviking
description: 翰林院 OpenViking 记忆增强 — 将小说写作 pipeline 的设定、摘要、伏笔接入 OpenViking 语义记忆。若你从属于翰林院，当你看到这个skill时，务必加载这个skill。
---

# 翰林院 OpenViking 记忆增强

OpenViking 已接管 OpenClaw 默认记忆后端（qmd），成为你的记忆系统。两者都是文件语义，切换无感。

本技能指导你如何将小说写作 pipeline 的记忆操作映射到 `memory_recall` / `memory_store` / `memory_forget`。

---

## 记忆操作映射

`novel-memory` 技能中的文件读写操作，在 OpenViking 下对应为：

| novel-memory（文件模式） | OpenViking（语义模式） |
|------------------------|----------------------|
| 写入 `设定/characters.md` | `memory_store` 人物档案 |
| 写入 `设定/world.md` | `memory_store` 世界观规则 |
| 写入 `设定/foreshadowing.md` | `memory_store` 伏笔条目 |
| 写入 `summary/chapter_XX.md` | `memory_store` 章节摘要 |
| grep 搜索设定文件 | `memory_recall` 语义查询 |
| 读 foreshadowing.md 查伏笔 | `memory_recall "未回收伏笔"` |
| 逐个读 summary 回顾前文 | `memory_recall` 一步定位相关章节 |
| 删除过时设定 | `memory_forget` 清理旧记忆 |

---

## 存入：什么时候 memory_store

### 新书初始化

```
memory_store: "{角色名}的人物档案：{性格}、{背景}、{动机}、{能力}"
memory_store: "世界观核心规则：{力量体系}、{社会结构}、{地理环境}"
memory_store: "故事主线：{核心冲突}、{主角目标}、{主要矛盾}"
```

### 每章归档后（配合 novel-archiving）

```
memory_store: "第X章摘要：{核心事件}；{角色状态变化}"
memory_store: "伏笔F{XXX}：{描述}，第X章埋设，预计第Y章回收"
memory_store: "{角色名}当前状态：位于{地点}，情绪{状态}，与{角色}关系变为{关系}"
```

### 设定变更时

```
memory_store: "{角色名}获得新能力：{能力描述}，来源：第X章{事件}"
memory_store: "新势力出现：{势力名}，{立场}，与{现有势力}的关系"
```

---

## 查询：什么时候 memory_recall

### 写作前（novel-prose）

```
memory_recall: "{角色名}的性格特征和当前状态"     → 确保人设一致
memory_recall: "第X章到第Y章的情节发展"           → 回顾上下文
memory_recall: "与{场景关键词}相关的世界设定"      → 确认设定细节
```

### 审核时（novel-review）

```
memory_recall: "{角色名}在前文中的行为模式"       → 验证角色一致性
memory_recall: "未回收的伏笔"                    → 检查伏笔遗漏
memory_recall: "{设定关键词}"                    → 交叉验证设定冲突
```

### 架构设计时（novel-worldbuilding）

```
memory_recall: "已有的世界观规则"                 → 避免设定矛盾
memory_recall: "现有角色的关系网络"               → 设计新角色时考虑已有关系
```

---

## 清理：什么时候 memory_forget

```
memory_forget: "角色{名}的旧状态"                → 角色状态大幅变化后清理旧版本
memory_forget: "伏笔F{XXX}"                     → 伏笔回收后清理埋设记录
```

---

## 注意事项

1. **store 内容要精炼**：存入的是摘要级信息，不是正文全文
2. **recall 结果要验证**：语义搜索可能返回相关但不精确的结果，关键设定需交叉确认
3. **auto-capture 会自动工作**：日常对话中的设定讨论会被自动捕获，无需手动 store 一切
