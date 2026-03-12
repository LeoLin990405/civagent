# 🐳 路径 B：Docker 部署

> ⏱️ 预计耗时：5 分钟 | 有 Docker 经验的用户首选，不污染系统环境
>
> ← [返回 README](../README.md) | 前置：[领服务器（可选）](./server-setup.md)

---

## 快速启动

预构建镜像支持 **amd64 + arm64**。

```bash
# 1. 克隆项目
git clone https://github.com/wanikua/boluobobo-ai-court-tutorial.git
cd boluobobo-ai-court-tutorial

# 2. 准备配置文件（复制模板，填入 API Key 和 Bot Token）
cp openclaw.example.json openclaw.json
nano openclaw.json

# 3. 一键启动
docker compose up -d

# 查看日志
docker compose logs -f

# 升级
docker compose pull && docker compose up -d
```

## 镜像信息

- 镜像：`ghcr.io/wanikua/boluobobo-ai-court-tutorial:latest`
- 内含：OpenClaw + Chromium + GitHub CLI + Python + OpenViking
- 工作区和配置通过 volume 持久化，升级不丢数据

## 端口

| 端口 | 用途 |
|------|------|
| 18789 | Gateway Dashboard |
| 18795 | 菠萝 GUI（可选） |

## 配置说明

配置文件里填 Discord Bot Token 或飞书 App ID/Secret 均可。Docker 模式支持所有平台。

```json
{
  "models": {
    "providers": {
      "your-provider": {
        "baseUrl": "https://api.your-provider.com",
        "apiKey": "你的API_KEY",
        "api": "your-api-format",
        "models": [...]
      }
    }
  },
  "channels": {
    "discord": {
      "enabled": true,
      "groupPolicy": "open",
      "accounts": {
        "main": { "name": "司礼监", "token": "你的Bot_Token", "groupPolicy": "open" }
      }
    }
  }
}
```

## 常用命令

```bash
docker compose up -d          # 启动
docker compose down           # 停止
docker compose logs -f        # 查看日志
docker compose pull && docker compose up -d  # 升级
docker compose exec openclaw bash            # 进入容器
```

---

← [返回 README](../README.md)
