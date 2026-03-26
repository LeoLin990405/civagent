# 安装脚本问题诊断与修复方案

## 🐛 用户反馈的问题

1. **没有人设** - 安装后 agent 没有 identity.theme
2. **安装脚本很乱** - 多个脚本功能重复，逻辑复杂

## 🔍 问题根源

### 问题 1: 人设丢失

**原因**：
- `install-lite.sh` 只下载 `openclaw.json` 模板
- 模板中的 identity.theme 是占位符文本
- 没有从 `configs/ming-neige/agents/*.md` 注入真实人设

**对比**：
```bash
# full-install.sh ✅
# 1. 复制 configs/ming-neige/openclaw.json
# 2. 遍历 agents/*.md 文件
# 3. 将人设内容注入到 JSON 的 identity.theme

# install-lite.sh ❌
# 1. 只下载 openclaw.json
# 2. 没有注入人设步骤
# 结果：使用占位符人设
```

### 问题 2: 脚本混乱

**现状**：
| 脚本 | 行数 | 功能 | 问题 |
|------|------|------|------|
| `install.sh` | 357 | 完整安装 | 与 full-install.sh 重复 |
| `install-lite.sh` | 434 | 精简安装 | 缺少人设注入 |
| `install-mac.sh` | 502 | Mac 专用 | 逻辑重复 |
| `full-install.sh` | 335 | 完整安装 | 功能最全 |

**总计**：1628 行，大量重复代码

---

## ✅ 修复方案

### 方案 A: 快速修复（推荐）

1. **修复 `install-lite.sh`** - 添加人设注入逻辑
2. **统一脚本** - 删除重复的 `install.sh`
3. **创建文档** - 明确各脚本用途

### 方案 B: 彻底重构

1. **创建核心安装库** - `scripts/install-core.sh`
2. **简化各脚本** - 只保留差异部分
3. **统一配置处理** - 共用配置注入逻辑

---

## 🔧 立即执行：方案 A

### 步骤 1: 修复 install-lite.sh

添加人设注入步骤：
```bash
# 在生成配置后添加
inject_personas() {
  local config_file="$1"
  local agents_dir="$2"
  
  if [ ! -d "$agents_dir" ]; then
    echo "⚠ 人设目录不存在"
    return
  fi
  
  echo "正在注入人设..."
  agent_count=$(jq '.agents.list | length' "$config_file")
  
  for ((i=0; i<agent_count; i++)); do
    agent_id=$(jq -r ".agents.list[$i].id" "$config_file")
    persona_file="$agents_dir/${agent_id}.md"
    
    if [ -f "$persona_file" ]; then
      persona=$(tail -n +3 "$persona_file")
      persona_escaped=$(echo "$persona" | jq -Rs '.')
      
      jq --argjson idx "$i" --argjson persona "$persona_escaped" \
        ".agents.list[$idx].identity.theme = \$persona" \
        "$config_file" > "${config_file}.tmp" && mv "${config_file}.tmp" "$config_file"
      
      echo "  ✓ $agent_id"
    fi
  done
}
```

### 步骤 2: 清理重复脚本

```bash
# 删除 install.sh (功能与 full-install.sh 重复)
rm install.sh

# 保留：
# - full-install.sh (完整安装，含人设注入)
# - install-lite.sh (精简安装，需修复)
# - install-mac.sh (Mac 专用，需同步修复)
```

### 步骤 3: 更新 README

明确脚本用途：
```markdown
## 安装方式

### 方式一：完整安装（推荐）
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/scripts/full-install.sh)
# ✅ 包含：环境检查 + 人设注入 + 配置生成

### 方式二：精简安装（已有 OpenClaw）
bash <(curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/install-lite.sh)
# ⚠️ 仅配置生成，人设使用默认模板
```

---

## 📋 待办事项

- [ ] 修复 `install-lite.sh` 人设注入
- [ ] 修复 `install-mac.sh` 人设注入
- [ ] 删除重复的 `install.sh`
- [ ] 更新 README 文档
- [ ] 测试所有安装流程
