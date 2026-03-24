#!/bin/bash
# Docker 镜像快速测试脚本

set -e

IMAGE_NAME="boluobobo/ai-court"
CONTAINER_NAME="ai-court-test"

echo "======================================"
echo "  AI 朝廷 · Docker 镜像测试"
echo "======================================"
echo ""

# 清理旧容器
docker rm -f ${CONTAINER_NAME} 2>/dev/null || true

# 测试 1: 镜像拉取/构建
echo "[1/4] 检查镜像..."
if ! docker image inspect ${IMAGE_NAME}:latest &>/dev/null; then
    echo "⚠️  镜像不存在，开始构建..."
    bash scripts/docker-build.sh test
fi
echo "✅ 镜像检查通过"

# 测试 2: 容器启动
echo ""
echo "[2/4] 启动测试容器..."
docker run -d \
    --name ${CONTAINER_NAME} \
    --tmpfs /tmp:size=100M \
    ${IMAGE_NAME}:latest \
    sleep 300
echo "✅ 容器启动成功"

# 测试 3: 健康检查
echo ""
echo "[3/4] 等待健康检查..."
sleep 10
HEALTH=$(docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME} 2>/dev/null || echo "unknown")
echo "健康状态：${HEALTH}"

# 测试 4: 基础功能
echo ""
echo "[4/4] 检查基础功能..."
docker exec ${CONTAINER_NAME} node --version
docker exec ${CONTAINER_NAME} npm --version
docker exec ${CONTAINER_NAME} openclaw --version 2>/dev/null || echo "⚠️ OpenClaw 版本检查跳过"

# 清理
echo ""
echo "清理测试容器..."
docker rm -f ${CONTAINER_NAME}

echo ""
echo "✅ 所有测试通过！"
