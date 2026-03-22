# 数据安全审计报告

**审计时间**: 2026-03-20  
**审计范围**: danghuangshang 全体系数据持久化与更新安全

---

## 📊 数据资产清单

### 1. 核心配置数据

| 位置 | 内容 | 风险等级 | 当前保护 |
|------|------|----------|----------|
| `~/.openclaw/openclaw.json` | 运行时配置（API Key、Token、Agent 人设） | 🔴 高 | 有备份 |
| `~/.openclaw/clawdbot.json` | Clawdbot 核心配置 | 🔴 高 | 有备份 |
| `~/.openclaw/credentials/` | 凭据文件 | 🔴 高 | 目录权限 700 |
| `danghuangshang/configs/*/openclaw.json` | 制度配置模板 | 🟡 中 | Git 版本控制 |
| `danghuangshang/configs/*/agents/*.md` | 人设文件 | 🟡 中 | Git 版本控制 |

### 2. 运行时数据

| 位置 | 内容 | 风险等级 | 当前保护 |
|------|------|----------|----------|
| `~/.openclaw/memory/` | 会话记忆 | 🟡 中 | 无备份 |
| `~/.openclaw/agents/*/` | Agent 工作空间 | 🟡 中 | 无备份 |
| `~/.openclaw/delivery-queue/` | 消息队列 | 🟢 低 | 可重建 |
| `~/.openclaw/sandbox/` | 沙盒环境 | 🟢 低 | 可重建 |

### 3. 项目数据

| 位置 | 内容 | 风险等级 | 当前保护 |
|------|------|----------|----------|
| `danghuangshang/` | 项目代码 | 🟢 低 | Git + GitHub |
| `danghuangshang/memory/` | 项目记忆 | 🟡 中 | Git 版本控制 |
| `danghuangshang/docs/` | 文档 | 🟢 低 | Git 版本控制 |

---

## ⚠️ 风险点分析

### 风险 1: 更新时配置被覆盖（已修复）

**问题**: `git pull` 或重装时，`~/.openclaw/openclaw.json` 可能被模板覆盖

**影响**: 
- ❌ API Key 丢失
- ❌ Discord Token 丢失
- ❌ Agent 人设丢失
- ❌ 自定义配置丢失

**已实施保护**:
- ✅ `install.sh` 自动备份 + 恢复凭据
- ✅ 人设独立文件存储
- ✅ `scripts/init-personas.sh` 可恢复人设

**剩余风险**: 
- ⚠️ 用户手动 `git pull` 后直接重启，未运行安装脚本

---

### 风险 2: Memory 数据无备份

**问题**: `~/.openclaw/memory/` 中的会话记忆无自动备份

**影响**: 
- ❌ 长期对话记忆丢失
- ❌ 上下文历史丢失

**建议保护**:
- [ ] 每日自动备份 memory 目录
- [ ] 备份到 Git 或云存储

---

### 风险 3: Agent 工作空间无备份

**问题**: `~/.openclaw/agents/*/` 中的工作文件无备份

**影响**:
- ❌ 未提交的代码丢失
- ❌ 临时文件丢失

**建议保护**:
- [ ] 重要项目自动 commit
- [ ] 工作空间定期快照

---

### 风险 4: 凭证文件权限

**问题**: 部分备份文件权限宽松（644）

**影响**:
- ⚠️ 敏感信息可能泄露

**建议保护**:
- [ ] 统一设置为 600
- [ ] 定期清理旧备份

---

## 🛡️ 已实施保护措施

### 1. 配置分离架构

```
之前:
~/.openclaw/openclaw.json (含人设 + 凭据)
  ↓ 更新时可能被覆盖

现在:
~/.openclaw/openclaw.json (运行时，自动备份)
danghuangshang/configs/*/agents/*.md (人设，Git 保护)
danghuangshang/install.sh (安装时自动恢复凭据)
```

### 2. 安装脚本保护

`install.sh` 流程：
1. 检测现有配置
2. 自动备份（带时间戳）
3. 提取凭据（API Key、Token）
4. 复制模板配置
5. 注入人设（从独立文件）
6. 恢复凭据
7. 验证 JSON 完整性
8. 可选重启 Gateway

### 3. 人设恢复脚本

```bash
# 人设丢失时恢复
bash scripts/init-personas.sh

# 从配置提取人设到独立文件
bash scripts/extract-personas.sh
```

---

## 📋 更新安全流程

### 安全更新步骤（推荐）

```bash
# 1. 自动备份
bash scripts/backup-all.sh  # ← 待创建

# 2. 拉取更新
git pull

# 3. 检查变更
git diff HEAD~1 --name-only

# 4. 如有配置变更，重新注入
bash scripts/init-personas.sh

# 5. 验证配置
openclaw status

# 6. 重启 Gateway
openclaw gateway restart
```

### 危险操作（禁止）

```bash
# ❌ 禁止直接覆盖配置
cp configs/ming-neige/openclaw.json ~/.openclaw/

# ❌ 禁止 git pull 后不检查直接重启
git pull && openclaw gateway restart

# ❌ 禁止手动编辑运行时配置（应编辑模板）
nano ~/.openclaw/openclaw.json
```

---

## 🔧 待实施保护

### 1. 自动备份脚本

```bash
#!/bin/bash
# scripts/backup-all.sh

# 备份：
# - ~/.openclaw/openclaw.json
# - ~/.openclaw/clawdbot.json
# - ~/.openclaw/memory/
# - ~/.openclaw/credentials/
# 到 danghuangshang/backups/
```

### 2. 更新前检查脚本

```bash
#!/bin/bash
# scripts/pre-update-check.sh

# 检查：
# - 配置是否有未保存变更
# - 是否需要备份
# - 人设是否完整
```

### 3. Git 钩子保护

```bash
# .git/hooks/pre-commit
# 禁止提交包含真实 API Key 的配置
```

### 4. Memory 自动备份

```bash
# cron 每日备份
0 3 * * * bash /home/ubuntu/danghuangshang/scripts/backup-memory.sh
```

---

## ✅ 安全检查清单

### 更新前

- [ ] 运行 `bash scripts/backup-all.sh`
- [ ] 记录当前版本号
- [ ] 确认 Gateway 状态正常
- [ ] 通知相关人员

### 更新后

- [ ] 检查配置完整性：`jq '.agents.list | length' ~/.openclaw/openclaw.json`
- [ ] 验证人设注入：`bash scripts/init-personas.sh --check`
- [ ] 测试 Gateway：`openclaw status`
- [ ] 测试 Discord 响应：群里@机器人
- [ ] 检查日志：`tail -f ~/.openclaw/logs/*.log`

---

## 📞 应急恢复流程

### 场景 1: 人设丢失

```bash
cd danghuangshang
bash scripts/init-personas.sh
openclaw gateway restart
```

### 场景 2: 配置损坏

```bash
# 恢复最新备份
cp ~/.openclaw/openclaw.json.bak.* ~/.openclaw/openclaw.json
openclaw gateway restart
```

### 场景 3: 完全重建

```bash
cd danghuangshang
bash install.sh  # 重新安装
# 按提示填写 API Key 和 Token
```

---

## 📈 安全评分

| 类别 | 之前 | 现在 | 目标 |
|------|------|------|------|
| 配置保护 | 2/10 | 7/10 | 9/10 |
| 人设保护 | 1/10 | 8/10 | 9/10 |
| 凭据保护 | 5/10 | 7/10 | 9/10 |
| Memory 保护 | 0/10 | 0/10 | 8/10 |
| 工作空间保护 | 0/10 | 0/10 | 7/10 |
| **总体** | **1.6/10** | **4.4/10** | **8.4/10** |

---

## 🎯 下一步行动

| 优先级 | 任务 | 责任 | 预计工时 |
|--------|------|------|----------|
| P0 | 创建 `backup-all.sh` | 工部 | 1h |
| P0 | 创建 `pre-update-check.sh` | 工部 | 1h |
| P1 | Memory 自动备份（cron） | 工部 | 2h |
| P1 | Git 钩子（防 API Key 泄露） | 都察院 | 1h |
| P2 | 工作空间自动 commit | 兵部 | 3h |
| P2 | 备份到云存储 | 户部 | 4h |

---

**结论**: 人设和配置保护已大幅改善，但 Memory 和工作空间保护仍需加强。
