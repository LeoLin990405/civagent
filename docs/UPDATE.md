# 安全更新指南

> 🛡️ 保护数据不丢失的标准流程

---

## ⚡ 快速更新（推荐）

```bash
cd danghuangshang

# 1. 自动备份 + 检查
bash scripts/backup-all.sh
bash scripts/pre-update-check.sh

# 2. 拉取更新
git pull

# 3. 重新注入人设
bash scripts/init-personas.sh

# 4. 验证 + 重启
openclaw status
openclaw gateway restart
```

---

## 📋 完整流程

### 步骤 1: 备份数据

```bash
bash scripts/backup-all.sh
```

**备份内容**:
- ✅ `~/.openclaw/openclaw.json` - 配置
- ✅ `~/.openclaw/clawdbot.json` - 核心配置
- ✅ `~/.openclaw/credentials/` - 凭据
- ✅ `~/.openclaw/memory/` - 会话记忆
- ✅ `~/.openclaw/devices.json` - 设备信息

**可选**: `--full` 包含 Agent 工作空间

```bash
bash scripts/backup-all.sh --full
```

---

### 步骤 2: 更新前检查

```bash
bash scripts/pre-update-check.sh
```

**检查项目**:
1. 配置文件完整性（JSON 格式）
2. Agent 人设完整性
3. API Key 配置
4. Discord Token 配置
5. Gateway 状态
6. Git 状态（未提交变更）
7. 备份状态

**输出示例**:
```
╔══════════════════════════════════════╗
║    🔍  AI 朝廷 · 更新前检查          ║
╚══════════════════════════════════════╝

[1/7] 配置文件完整性...
  ✓ JSON 格式正确

[2/7] Agent 人设完整性...
  Agent 总数：18
  已配置人设：18
  ✓ 所有 Agent 已配置人设

[3/7] API Key 配置...
  配置 Provider: 3
  有效 API Key: 2
  ✓ 已配置有效 API Key

...

✓ 所有检查通过，可以安全更新！
```

---

### 步骤 3: 拉取更新

```bash
git pull
```

**如果有冲突**:
```bash
# 查看冲突文件
git status

# 保留本地配置（不覆盖）
git checkout --ours ~/.openclaw/openclaw.json

# 或者接受远程版本
git checkout --theirs ~/.openclaw/openclaw.json

# 解决后提交
git add .
git commit -m "解决冲突"
```

---

### 步骤 4: 重新注入人设

```bash
bash scripts/init-personas.sh
```

**作用**:
- 从独立文件 (`configs/*/agents/*.md`) 读取人设
- 注入到运行时配置 (`~/.openclaw/openclaw.json`)
- 保留现有 API Key 和 Token
- 验证完整性

---

### 步骤 5: 验证配置

```bash
# 检查 Gateway 状态
openclaw status

# 验证人设
jq '.agents.list[].identity.theme' ~/.openclaw/openclaw.json | head -20

# 检查 Discord 配置
jq '.channels.discord' ~/.openclaw/openclaw.json
```

---

### 步骤 6: 重启 Gateway

```bash
openclaw gateway restart
```

**验证**:
```bash
# 查看日志
tail -f ~/.openclaw/logs/*.log

# 测试响应
# 在 Discord 群里 @机器人
```

---

## 🚨 应急恢复

### 场景 1: 更新后人设丢失

```bash
cd danghuangshang
bash scripts/init-personas.sh
openclaw gateway restart
```

---

### 场景 2: 配置损坏

```bash
# 找到最新备份
ls -lt ~/danghuangshang/backups/configs/ | head

# 恢复配置
cp ~/danghuangshang/backups/configs/openclaw.json.YYYYMMDD_HHMMSS ~/.openclaw/openclaw.json

# 重启
openclaw gateway restart
```

---

### 场景 3: 完全重建

```bash
cd danghuangshang
bash install.sh

# 按提示:
# 1. 选择制度
# 2. 填写 API Key
# 3. 填写 Discord Token
# 4. 重启 Gateway
```

---

## 🛡️ 保护机制

### 自动备份

`install.sh` 和 `init-personas.sh` 都会：
1. 自动备份现有配置（带时间戳）
2. 提取并保留凭据（API Key、Token）
3. 验证 JSON 完整性
4. 失败时恢复备份

### 人设独立存储

```
之前:
~/.openclaw/openclaw.json (含人设，易丢失)

现在:
~/.openclaw/openclaw.json (运行时，自动备份)
danghuangshang/configs/*/agents/*.md (人设，Git 保护)
```

### 配置分离

```
danghuangshang/configs/ming-neige/
  ├── openclaw.json         # 结构模板（不含敏感信息）
  └── agents/
      ├── silijian.md       # 人设文件
      ├── neige.md
      └── ...
```

---

## ⚠️ 禁止操作

```bash
# ❌ 禁止直接覆盖配置
cp configs/ming-neige/openclaw.json ~/.openclaw/

# ❌ 禁止 git pull 后不检查直接重启
git pull && openclaw gateway restart

# ❌ 禁止手动编辑运行时配置（应编辑模板）
nano ~/.openclaw/openclaw.json

# ❌ 禁止删除备份目录
rm -rf danghuangshang/backups/
```

---

## 📊 检查清单

### 更新前

- [ ] 运行 `bash scripts/backup-all.sh`
- [ ] 运行 `bash scripts/pre-update-check.sh`
- [ ] 确认无严重问题
- [ ] 记录当前版本号：`git rev-parse HEAD`

### 更新后

- [ ] 运行 `bash scripts/init-personas.sh`
- [ ] 验证人设：`jq '.agents.list | length' ~/.openclaw/openclaw.json`
- [ ] 测试 Gateway：`openclaw status`
- [ ] 测试 Discord：群里@机器人
- [ ] 检查日志：`tail -f ~/.openclaw/logs/*.log`

---

## 🔧 自动化（可选）

### Cron 自动备份

```bash
# 编辑 crontab
crontab -e

# 添加每日备份（凌晨 3 点）
0 3 * * * bash /home/ubuntu/danghuangshang/scripts/backup-all.sh >> /var/log/danghuangshang-backup.log 2>&1
```

### Git 钩子保护

```bash
# .git/hooks/pre-commit
#!/bin/bash
# 禁止提交包含真实 API Key 的配置

if git diff --cached | grep -q '"apiKey": "sk-[a-zA-Z0-9]\{32,\}"'; then
  echo "错误：禁止提交真实 API Key！"
  echo "请使用占位符：YOUR_LLM_API_KEY"
  exit 1
fi
```

---

## 📞 求助

如果更新过程中遇到问题：

1. **查看日志**: `tail -f ~/.openclaw/logs/*.log`
2. **检查配置**: `jq '.' ~/.openclaw/openclaw.json`
3. **恢复备份**: `bash scripts/backup-all.sh` (查看可用备份)
4. **重新安装**: `bash install.sh`

---

## 📈 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-03-20 | 初始版本，人设独立存储 |
| 1.1 | 2026-03-20 | 增加自动备份脚本 |
| 1.2 | 2026-03-20 | 增加更新前检查脚本 |

---

**最后更新**: 2026-03-20  
**维护者**: 吏部
