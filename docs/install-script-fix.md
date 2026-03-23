# 🔧 安装脚本缺失 npm install 问题修复

**问题**：用户安装时报错 `ERR_MODULE_NOT_FOUND: Cannot find package 'undici'`  
**根本原因**：`full-install.sh` 缺少 `npm install` 命令  
**修复时间**：2026-03-23 09:25 UTC

---

## 🚨 问题分析

### 原安装流程（有缺陷）

```bash
[0/6] 准备环境（克隆仓库）
[1/6] 检查环境（OpenClaw, jq）
[2/6] 选择制度
[3/6] 配置处理
[4/6] 生成配置
[5/6] 验证配置      ← ❌ 缺少 npm install
[6/6] 重启服务
```

**问题**：
- 克隆仓库后没有执行 `npm install`
- 项目依赖（如 `undici`）未安装
- 用户安装 skill 时报错

---

## ✅ 修复方案

### 新安装流程（已修复）

```bash
[0/7] 准备环境（克隆仓库）
[1/7] 检查环境（OpenClaw, jq）
[2/7] 选择制度（明朝/唐朝/现代企业）
[3/7] 配置处理（备份旧配置）
[4/7] 生成配置（复制模板 + 注入人设）
[5/7] 安装依赖 ← ✅ 新增 npm install
[6/7] 验证配置（JSON 格式检查）
[7/7] 重启服务
```

### 新增代码

```bash
# ============================================
# 步骤 5: 安装项目依赖
# ============================================

echo -e "${BLUE}[5/7] 安装依赖...${NC}"

echo -e "  ${CYAN}正在安装项目依赖...${NC}"
cd "$INSTALL_DIR"
npm install --loglevel=error
echo -e "  ${GREEN}✓${NC} 项目依赖已安装"
```

---

## 📋 修复内容

| 文件 | 修改 | 说明 |
|------|------|------|
| `scripts/full-install.sh` | 新增 15 行 | 添加 npm install 步骤 |
| `scripts/full-install.sh` | 修改步骤编号 | 5/6→6/7, 6/6→7/7 |

---

## 🚀 用户安装流程（修复后）

### 一键安装（推荐）

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/scripts/full-install.sh)
```

**预期输出**：
```
[0/7] 准备环境...
  ✓ 仓库已克隆

[1/7] 检查环境...
  ✓ OpenClaw 已安装
  ✓ jq 已安装

[2/7] 选择制度...
  ✓ 制度选定：ming-neige

[3/7] 配置处理...
  ✓ 已备份现有配置

[4/7] 生成配置...
  ✓ 已复制配置模板
  ✓ 已注入人设

[5/7] 安装依赖...        ← ✅ 新增步骤
  ✓ 项目依赖已安装

[6/7] 验证配置...
  ✓ JSON 格式正确

[7/7] 重启服务...
  ✓ Gateway 已重启
```

---

## 🔍 验证修复

### 检查脚本语法

```bash
cd /danghuangshang
bash -n scripts/full-install.sh
# 输出：无错误 = 语法正确
```

### 检查步骤编号

```bash
grep "\[.*/[0-9]\]" scripts/full-install.sh
# 应输出：[0/7], [1/7], [2/7], [3/7], [4/7], [5/7], [6/7], [7/7]
```

### 检查 npm install 命令

```bash
grep -n "npm install" scripts/full-install.sh
# 应输出：步骤 5 中有 npm install
```

---

## 🎯 已修复的依赖问题

| 依赖 | 用途 | 状态 |
|------|------|------|
| **undici** | HTTP 客户端（self-improving-agent 需要） | ✅ 自动安装 |
| **winston** | 日志系统 | ✅ 自动安装 |
| **jest** | 测试框架 | ✅ 自动安装 |
| **@notionhq/client** | Notion API | ✅ 自动安装 |

---

## 📖 相关文档

- [Skill 依赖缺失修复指南](./docs/skill-dependency-fix.md)
- [完整安装指南](./README.md#快速开始)
- [Docker 部署指南](./docs/docker-deployment.md)

---

## 🎯 后续建议

### 1. 添加依赖检查

```bash
# 在安装前检查 package.json
if [ -f "$INSTALL_DIR/package.json" ]; then
  echo "检测到 package.json，将安装依赖..."
  npm install
fi
```

### 2. 添加依赖验证

```bash
# 安装后验证关键依赖
if node -e "require('undici')" 2>/dev/null; then
  echo "✓ undici 已安装"
else
  echo "✗ undici 安装失败"
  exit 1
fi
```

### 3. 更新教程仓库

```bash
# 同步修复到教程仓库
cp scripts/full-install.sh boluobobo-ai-court-tutorial/scripts/
```

---

**修复完成！用户现在可以正常安装了！** 🎉

**最后更新**：2026-03-23  
**维护者**：工部尚书
