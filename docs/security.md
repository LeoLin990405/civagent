# 🛡️ 安全须知

> ← [返回 README](../README.md) | [FAQ →](./faq.md)

---

## ⚠️ 不建议在本地电脑安装

**强烈建议使用云服务器，不要在个人电脑上跑 Agent：**

| | 云服务器 | 本地电脑 |
|---|---|---|
| Agent 能动的文件 | 仅服务器上的工作区 | **你的所有个人文件** |
| 搞坏了怎么办 | 重建服务器，5 分钟恢复 | 个人文件可能丢失 |
| API Key 泄露风险 | 隔离在服务器 | 暴露在个人环境 |
| 24 小时在线 | ✅ 服务器不关机 | ❌ 关电脑就停了 |

> 🔴 **特别提醒**：Agent 拥有工作区内的**完整读写权限**，包括执行命令。如果你把工作区设成 `$HOME`（家目录），Agent 理论上可以读写你的所有文件。在云服务器上这不是问题（服务器本来就是给它用的），但在个人电脑上就是安全隐患。

---

## 🔒 Workspace 权限配置

`workspace` 是 Agent 的"领地"——它只能读写这个目录。配置原则：

```
✅ 推荐：专用目录
"workspace": "/home/ubuntu/clawd"        ← Agent 只能动这个目录

❌ 危险：家目录
"workspace": "/home/ubuntu"              ← Agent 能动你所有文件

❌ 绝对不要：根目录
"workspace": "/"                         ← 等于给 Agent root 权限
```

---

## 🐳 Sandbox 沙箱配置详解

沙箱 = Docker 容器。开了沙箱的 Agent 会在独立容器里运行，**文件系统只读、不能 apt 装软件、不继承主机环境变量**。好处是安全隔离，坏处是能力受限。

| 模式 | 含义 | 适合谁 | 能做什么 |
|------|------|--------|----------|
| `"off"` | **不用沙箱**，直接在主机上运行 | 司礼监、礼部、户部等不跑代码的 | ✅ 读写文件 ✅ 装软件 ✅ 网络 ✅ 完整权限 |
| `"non-main"` | **主对话不沙箱，spawn 出来的子任务沙箱** | defaults 默认值 | 主对话正常，子任务隔离 |
| `"all"` | **所有对话都在沙箱里** | 兵部、都察院等要跑代码的 | ❌ 只读文件系统 ❌ 不能装软件 ✅ 工作区可读写 |

> ⚠️ **常见坑：** 如果你的 Agent 报「只读文件系统」「apt 失败」，十有八九是 sandbox mode 设成了 `all`。不写代码的部门直接设 `"off"` 就行。

### 推荐配置

- 🔴 **需要跑代码的（兵部、都察院）** → `"mode": "all", "scope": "agent"`（安全隔离）
- 🟢 **不跑代码的（礼部、户部、吏部、刑部、翰林院等）** → `"mode": "off"`（完整能力）
- 🟡 **司礼监** → `"mode": "off"`（需要调度所有部门，必须有完整权限）

```json
"agents": {
  "defaults": {
    "workspace": "/home/ubuntu/clawd",
    "sandbox": { "mode": "non-main" }
  },
  "list": [
    { "id": "silijian", "sandbox": { "mode": "off" } },
    { "id": "bingbu", "sandbox": { "mode": "all", "scope": "agent" } },
    { "id": "duchayuan", "sandbox": { "mode": "all", "scope": "agent" } },
    { "id": "libu", "sandbox": { "mode": "off" } },
    { "id": "hubu", "sandbox": { "mode": "off" } }
  ]
}
```

> 💡 `"scope": "agent"` 表示每个 Agent 有自己独立的沙箱容器，互不干扰。

---

## 🔑 API Key 安全

- **不要** 把含 API Key 的配置文件提交到 GitHub 公开仓库
- **不要** 在群聊里发 API Key
- **建议** 给 API Key 设置用量上限（在 LLM 服务商后台）
- **建议** 定期轮换 Key

---

## 📜 免责声明 / Disclaimer

本项目按"原样"提供，不承担任何直接或间接责任。/ This project is provided "as is" without any warranties.

**使用前请注意 / Please note:**

1. **AI 生成内容仅供参考 / AI-generated content is for reference only**
   - AI 生成的代码、文案、建议等可能存在错误或不准确之处
   - 使用前请自行审核，确认无风险后再实际应用

2. **代码安全 / Code Security**
   - 自动生成的代码建议在合并前进行 code review
   - 涉及财务、安全敏感的操作请务必人工复核

3. **API 密钥安全 / API Key Security**
   - 请妥善保管您的 API 密钥 / Keep your API keys safe
   - 不要将包含密钥的配置文件提交到公开仓库

4. **服务器费用 / Server Costs**
   - 免费服务器有一定使用限额 / Free servers have usage limits
   - 超出限额后可能产生费用，请留意账单

5. **数据备份 / Data Backup**
   - 建议定期备份您的工作区和数据
   - 本项目不提供任何数据保证

---

← [返回 README](../README.md)
