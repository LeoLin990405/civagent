# 🐳 Docker 部署指南

> **Docker 镜像**：`boluobobo/ai-court:latest`  
> **支持架构**：linux/amd64, linux/arm64  
> **版本**：v3.6.0

---

## 🚀 快速开始

### 方式一：Docker Compose（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/wanikua/danghuangshang.git
cd danghuangshang

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 API Key 和 Bot Token

# 3. 启动服务
docker compose up -d

# 4. 查看日志
docker compose logs -f
```

### 方式二：Docker 命令

```bash
# 1. 拉取镜像
docker pull boluobobo/ai-court:latest

# 2. 运行容器
docker run -d \
  --name ai-court \
  -p 18789:18789 \
  -p 18795:18795 \
  -v ~/.openclaw:/root/.openclaw \
  -v ~/clawd:/root/clawd \
  -e ANTHROPIC_API_KEY=your_key \
  -e DISCORD_BOT_TOKEN=your_token \
  boluobobo/ai-court:latest
```

---

## 📋 配置文件

### .env 示例

```bash
# LLM API Keys
ANTHROPIC_API_KEY=sk-ant-xxx
DASHSCOPE_API_KEY=sk-xxx

# Discord Bot Tokens
SILIJIAN_BOT_TOKEN=xxx
NEIGE_BOT_TOKEN=xxx

# Webhook Secrets
WEBHOOK_GITHUB_SECRET=xxx
WEBHOOK_FEISHU_SECRET=xxx

# 其他配置
NODE_ENV=production
LOG_LEVEL=info
```

### docker-compose.yml

```yaml
services:
  openclaw:
    image: boluobobo/ai-court:latest
    container_name: ai-court
    restart: unless-stopped
    ports:
      - "18789:18789"  # Gateway WebUI
      - "18795:18795"  # GUI Dashboard
    volumes:
      - ~/.openclaw:/root/.openclaw
      - ~/clawd:/root/clawd
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
      - WEBHOOK_GITHUB_SECRET=${WEBHOOK_GITHUB_SECRET}
      - WEBHOOK_FEISHU_SECRET=${WEBHOOK_FEISHU_SECRET}
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:18789/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## 🔧 常用命令

### 容器管理

```bash
# 启动
docker compose up -d

# 停止
docker compose down

# 重启
docker compose restart

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 进入容器
docker compose exec openclaw bash
```

### 更新镜像

```bash
# 拉取最新镜像
docker pull boluobobo/ai-court:latest

# 重新部署
docker compose up -d --force-recreate

# 清理旧镜像
docker image prune -f
```

### 备份数据

```bash
# 备份配置
docker run --rm \
  -v ~/.openclaw:/backup \
  -v $(pwd):/output \
  alpine tar czf /output/openclaw-backup-$(date +%Y%m%d).tar.gz /backup

# 恢复配置
docker run --rm \
  -v ~/.openclaw:/restore \
  -v $(pwd):/source \
  alpine tar xzf /source/openclaw-backup-20260322.tar.gz -C /restore
```

---

## 🛡️ 安全配置

### 1. 网络安全

```yaml
# docker-compose.yml
networks:
  ai-court:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

services:
  openclaw:
    networks:
      ai-court:
        ipv4_address: 172.20.0.10
```

### 2. 限制端口访问

```bash
# UFW 防火墙配置
ufw allow 18789/tcp  # WebUI
ufw allow 18795/tcp  # GUI
ufw deny 其他端口
```

### 3. 使用 Docker Secrets（生产环境）

```yaml
# docker-compose.yml
services:
  openclaw:
    secrets:
      - anthropic_api_key
      - discord_bot_token

secrets:
  anthropic_api_key:
    external: true
  discord_bot_token:
    external: true
```

---

## 📊 监控与日志

### 查看日志

```bash
# 实时日志
docker compose logs -f

# 最近 100 行
docker compose logs --tail=100

# 错误日志
docker compose logs | grep ERROR
```

### 资源监控

```bash
# 容器资源使用
docker stats ai-court

# 详细信息
docker inspect ai-court
```

### 健康检查

```bash
# 检查健康状态
docker inspect --format='{{.State.Health.Status}}' ai-court

# 访问健康端点
curl http://localhost:18789/health
```

---

## 🔍 故障排查

### 问题 1：容器无法启动

```bash
# 查看错误日志
docker compose logs

# 检查端口占用
lsof -i :18789
lsof -i :18795

# 检查配置文件
docker compose config
```

### 问题 2：API Key 无效

```bash
# 检查环境变量
docker compose exec openclaw env | grep API_KEY

# 重新加载配置
docker compose restart
```

### 问题 3：内存不足

```bash
# 查看资源使用
docker stats

# 调整限制（docker-compose.yml）
deploy:
  resources:
    limits:
      memory: 2G  # 降低限制
```

---

## 📦 镜像构建（本地）

### 手动构建

```bash
# 构建镜像
docker build -t boluobobo/ai-court:local .

# 测试运行
docker run -it --rm \
  -p 18789:18789 \
  -e ANTHROPIC_API_KEY=xxx \
  boluobobo/ai-court:local
```

### 多架构构建

```bash
# 启用 Buildx
docker buildx create --use

# 构建多架构镜像
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t boluobobo/ai-court:latest \
  --push .
```

---

## 🎯 最佳实践

### 1. 生产环境配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  openclaw:
    image: boluobobo/ai-court:latest
    restart: always
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

### 2. 日志轮转

```json
// daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}
```

### 3. 自动更新

```bash
# 使用 Watchtower 自动更新
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 86400 \
  ai-court
```

---

## 📖 参考文档

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [GitHub Actions Docker](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)

---

**最后更新**：2026-03-22  
**维护者**：工部尚书
