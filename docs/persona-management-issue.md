# 人设管理问题诊断报告

**问题**: 系统更新后人设丢失，机器人不遵守人设，群里@不理人

---

## 🔍 根本原因分析

### 问题 1: 人设写在 openclaw.json 中

**当前结构**:
```json
{
  "agents": {
    "list": [
      {
        "id": "silijian",
        "identity": {
          "theme": "你是 AI 朝廷的司礼监大内总管..."
        }
      }
    ]
  }
}
```

**问题**:
- ❌ openclaw.json 是动态配置文件，系统更新时可能被覆盖
- ❌ 人设内容冗长，污染配置文件
- ❌ 难以版本管理和 diff
- ❌ 每次切换制度需要手动复制完整配置

---

### 问题 2: 配置与内容未分离

**好的设计**:
```
configs/ming-neige/
  ├── openclaw.json      # 只含结构，不含人设
  ├── agents/
  │   ├── silijian.md    # 司礼监人设
  │   ├── neige.md       # 内阁人设
  │   └── ...
  └── SOUL.md            # 制度说明
```

**当前设计**:
```
configs/ming-neige/
  ├── openclaw.json      # 含所有人设（冗长）
  └── SOUL.md            # 制度说明
```

---

### 问题 3: 初始化脚本缺失

系统安装/更新后，没有脚本自动注入人设到配置中。

---

## ✅ 解决方案

### 方案 A: 人设文件分离（推荐）

**目录结构**:
```
configs/ming-neige/
  ├── config.json        # 配置模板（不含人设）
  ├── agents/
  │   ├── silijian.md
  │   ├── neige.md
  │   ├── duchayuan.md
  │   └── ...
  └── SOUL.md
```

**初始化脚本**:
```bash
#!/bin/bash
# scripts/init-personas.sh

CONFIG_DIR="$HOME/.openclaw"
PERSONAS_DIR="$DANGHUANGSHANG_ROOT/configs/$REGIME/agents"

for agent_file in "$PERSONAS_DIR"/*.md; do
  agent_id=$(basename "$agent_file" .md)
  persona=$(cat "$agent_file")
  
  # 注入到 openclaw.json
  jq --arg id "$agent_id" --arg persona "$persona" \
    '.agents.list[] | select(.id == $id) | .identity.theme = $persona' \
    "$CONFIG_DIR/openclaw.json" > tmp.json
  mv tmp.json "$CONFIG_DIR/openclaw.json"
done
```

---

### 方案 B: 保留当前结构 + 增加备份恢复

如果不想大改，至少：

1. **增加人设备份**
   ```bash
   scripts/backup-personas.sh
   # 提取 openclaw.json 中的人设到独立文件
   ```

2. **增加人设恢复**
   ```bash
   scripts/restore-personas.sh
   # 系统更新后恢复人设
   ```

3. **更新 switch-regime.sh**
   - 切换前先备份当前人设
   - 切换后提示用户检查人设

---

## 🔧 立即修复步骤

### 步骤 1: 检查当前配置

```bash
# 检查 openclaw.json 是否包含人设
grep -c "identity" ~/.openclaw/openclaw.json

# 检查人设是否完整
jq '.agents.list[].identity.theme' ~/.openclaw/openclaw.json | head -20
```

### 步骤 2: 备份人设

```bash
# 提取人设到独立文件
jq -r '.agents.list[] | "\(.id): \(.identity.theme)"' ~/.openclaw/openclaw.json > personas-backup.txt
```

### 步骤 3: 恢复人设（如果丢失）

```bash
# 从 configs 目录恢复
cp /home/ubuntu/danghuangshang/configs/ming-neige/openclaw.json ~/.openclaw/
# 然后手动更新 API Key 和 Token
```

### 步骤 4: 重启 Gateway

```bash
openclaw gateway restart
```

---

## 📝 长期建议

### 1. 配置分层

```
~/.openclaw/
  ├── openclaw.json      # 用户自定义配置（API Key、Token 等）
  └── personas/          # 人设文件（从 danghuangshang 同步）
      ├── silijian.md
      └── ...

danghuangshang/
  ├── configs/
  │   └── ming-neige/
  │       ├── config-template.json  # 配置模板
  │       └── agents/               # 人设文件
  └── scripts/
      └── init-personas.sh          # 初始化脚本
```

### 2. 安装流程

```bash
# 安装脚本
bash install.sh

# 自动执行
1. 复制 config-template.json → ~/.openclaw/openclaw.json
2. 提示用户填写 API Key、Token
3. 运行 init-personas.sh 注入人设
4. 重启 Gateway
```

### 3. 更新流程

```bash
# 更新脚本
bash update.sh

# 自动执行
1. 备份当前配置（含人设）
2. 拉取最新代码
3. 比较配置模板变化
4. 提示用户合并变更
5. 恢复人设（如果模板兼容）
```

---

## ⚠️ 当前紧急修复

**如果人设已丢失，执行以下命令**:

```bash
cd /home/ubuntu/danghuangshang

# 1. 备份当前配置
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak.$(date +%Y%m%d_%H%M%S)

# 2. 复制完整配置（含人设）
cp configs/ming-neige/openclaw.json ~/.openclaw/

# 3. 更新 API Key 和 Token（手动编辑）
nano ~/.openclaw/openclaw.json

# 4. 重启 Gateway
openclaw gateway restart
```

---

## 🎯 责任分工

| 问题 | 责任部门 | 任务 |
|------|----------|------|
| 配置分离 | 工部 | 重构 configs 目录结构 |
| 初始化脚本 | 兵部 | 编写 init-personas.sh |
| 文档更新 | 翰林院 | 编写配置管理文档 |
| 测试验证 | 都察院 | 审查配置流程安全性 |

---

**建议**: 立即执行紧急修复，然后实施方案 A（配置分离）。
