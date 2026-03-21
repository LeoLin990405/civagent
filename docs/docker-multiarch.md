# Docker 多架构构建指南

> 支持 **amd64**（Intel/AMD）和 **arm64**（Apple Silicon/ARM 服务器）

---

## 📋 当前状态

**问题**：
- ❌ Dockerfile 未指定平台
- ❌ docker-compose.yml 未配置多架构
- ❌ GitHub Actions 无多架构构建流程

**影响**：
- ARM 用户（M1/M2/M3 Mac、Oracle ARM 服务器）可能无法运行或性能差
- 需要通过 Rosetta 转译（慢且不稳定）

---

## ✅ 修复方案

### 方案 1：Dockerfile 添加平台说明（推荐）

```dockerfile
# Dockerfile 开头添加
# syntax=docker/dockerfile:1
# Platform: linux/amd64, linux/arm64
```

### 方案 2：docker-compose.yml 指定平台

```yaml
services:
  court:
    image: boluobobo/ai-court:latest
    platform: linux/amd64  # ⚠️ 强制 amd64（不推荐）
    # 或删除 platform 让 Docker 自动选择
```

### 方案 3：构建多架构镜像（生产环境）

```bash
# 1. 启用 Buildx
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap

# 2. 构建多架构镜像
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t boluobobo/ai-court:latest \
  -t boluobobo/ai-court:v3.6.0 \
  --push \
  .

# 3. 验证
docker buildx imagetools inspect boluobobo/ai-court:latest
# 应显示：
# Name:      boluobobo/ai-court:latest
# MediaType: application/vnd.docker.distribution.manifest.list.v2+json
# Platforms:
#   - linux/amd64
#   - linux/arm64
```

---

## 🔧 GitHub Actions 配置

创建 `.github/workflows/docker-build.yml`：

```yaml
name: Docker Build

on:
  push:
    tags: ['v*']
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            boluobobo/ai-court:latest
            boluobobo/ai-court:${{ github.ref_name }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## 📊 架构支持对比

| 架构 | 平台 | 状态 | 说明 |
|------|------|------|------|
| **amd64** | Intel/AMD x86_64 | ✅ 支持 | Oracle AMD、AWS、GCP 等 |
| **arm64** | ARM 64-bit | ⚠️ 需测试 | Oracle ARM、M1/M2/M3 Mac、树莓派 4 |
| **arm/v7** | ARM 32-bit | ❌ 不支持 | 树莓派 3 及更早版本 |

---

## 🧪 测试步骤

### AMD64 测试

```bash
docker run --platform linux/amd64 -it boluobobo/ai-court:latest bash
# 验证：uname -m → x86_64
```

### ARM64 测试

```bash
docker run --platform linux/arm64 -it boluobobo/ai-court:latest bash
# 验证：uname -m → aarch64
```

---

## 📝 文档更新

### README.md

```markdown
### Docker 部署

**支持架构**：
- ✅ linux/amd64（Intel/AMD）
- ✅ linux/arm64（Apple Silicon/ARM 服务器）

```bash
docker compose up -d
```
```

### setup-docker.md

```markdown
## 架构兼容性

本 Docker 镜像支持多架构：
- **amd64**：Oracle AMD、AWS t3/x86、GCP N1/N2
- **arm64**：Oracle ARM、AWS Graviton、M1/M2/M3 Mac

Docker 会自动选择适合你平台的镜像，无需手动配置。
```

---

## 🎯 行动建议

### 立即修复（P1）

1. ✅ Dockerfile 添加平台说明注释
2. ✅ 测试 arm64 构建
3. ✅ 更新文档说明支持的架构

### 本周完成（P2）

1. ✅ 创建 GitHub Actions 多架构构建流程
2. ✅ 构建并推送多架构镜像
3. ✅ 验证两个架构都能正常运行

### 长期优化（P3）

1. ⏳ 添加 arm/v7 支持（树莓派）
2. ⏳ 镜像大小优化（多阶段构建）
3. ⏳ 安全扫描（Trivy）

---

## 🔗 参考

- [Docker 多架构构建官方文档](https://docs.docker.com/build/building/multi-platform/)
- [Docker Buildx 使用指南](https://docs.docker.com/engine/reference/commandline/buildx/)
- [GitHub Actions Docker 示例](https://github.com/docker/build-push-action)
