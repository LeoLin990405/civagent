# 🔧 Skill 依赖缺失问题修复指南

**问题**：安装 `self-improving-agent` skill 时报错  
**错误信息**：`ERR_MODULE_NOT_FOUND: Cannot find package 'undici'`

---

## 🚨 问题原因

**根本原因**：
- `self-improving-agent` skill 依赖 `undici` HTTP 客户端
- 但 skill 的 `package.json` 未声明此依赖
- 导致 `clawdhub install` 时未自动安装

**影响范围**：
- ✅ 已修复：主仓库 `skills/self-improving-agent/package.json`
- ⏳ 待修复：教程仓库 `boluobobo-ai-court-tutorial/skills/self-improving-agent/package.json`

---

## ✅ 用户修复方案（3 种）

### 方案一：手动安装缺失依赖（最快）

```bash
# 1. 进入项目目录
cd /danghuangshang

# 2. 安装 undici
npm install undici

# 3. 重新安装 skill
clawdhub install self-improving-agent

# 4. 验证
clawdhub list
```

**预期输出**：
```
✅ self-improving-agent installed successfully
```

---

### 方案二：使用修复后的仓库（推荐）

```bash
# 1. 拉取最新代码
cd /danghuangshang
git pull origin main

# 2. 重新安装依赖
npm install

# 3. 安装 skill
clawdhub install self-improving-agent
```

---

### 方案三：完整清理重装

```bash
# 1. 清理
cd /danghuangshang
rm -rf node_modules package-lock.json

# 2. 重新安装
npm install

# 3. 安装 skill
clawdhub install self-improving-agent
```

---

## 🛠️ 开发者修复方案

### 为 skill 添加 package.json

```json
{
  "name": "self-improving-agent",
  "version": "3.0.5",
  "description": "Self-improving Agent with reflection and learning capabilities",
  "main": "index.js",
  "type": "commonjs",
  "dependencies": {
    "undici": "^5.28.0"
  },
  "peerDependencies": {
    "@openclaw/core": ">=1.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "license": "MIT"
}
```

**位置**：
- `skills/self-improving-agent/package.json`
- `boluobobo-ai-court-tutorial/skills/self-improving-agent/package.json`

---

## 📋 其他缺失 package.json 的 skill

检查发现以下 skill 也缺少 `package.json`：

```
❌ browser-use
❌ github
❌ hacker-news
❌ notion
❌ novel-archiving
❌ novel-memory
❌ novel-prose
❌ novel-research
❌ novel-review
❌ novel-worldbuilding
❌ openviking
❌ quadrants
❌ weather
```

**建议**：
- 如果这些 skill 有外部依赖，需要添加 `package.json`
- 如果没有依赖，可以保持现状

---

## 🎯 预防措施

### 1. Skill 模板添加 package.json

```bash
# 创建 skill 时的标准结构
skills/my-skill/
├── package.json      # ← 必需
├── SKILL.md
├── _meta.json
└── index.js
```

### 2. CI/CD 检查

```yaml
# .github/workflows/skill-check.yml
- name: Check skill dependencies
  run: |
    for skill in skills/*/; do
      if [ ! -f "$skill/package.json" ]; then
        echo "⚠️ Warning: $skill missing package.json"
      fi
    done
```

### 3. 安装脚本检查

```bash
# scripts/check-skill-deps.sh
#!/bin/bash
for skill in skills/*/; do
  if [ -f "$skill/index.js" ] && [ ! -f "$skill/package.json" ]; then
    echo "⚠️ $skill: No package.json found"
  fi
done
```

---

## 📖 相关文档

- [Skill 开发指南](./docs/skill-development.md)
- [ClawdHub 使用指南](./docs/clawdhub-usage.md)
- [依赖管理最佳实践](./docs/dependency-management.md)

---

**最后更新**：2026-03-23  
**维护者**：工部尚书
