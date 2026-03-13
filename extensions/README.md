# Extensions - 可选扩展包

本目录包含**不默认启用**的可选扩展。需要手动复制到 `skills/` 目录才会被 Agent 加载。

## 可用扩展

| 扩展 | 说明 | 前置依赖 |
|------|------|---------|
| [novel-openviking](./novel-openviking/) | 翰林院 OpenViking 增强：语义搜索 + 知识图谱 | OpenViking 已安装 |

## 启用

```bash
# 启用扩展（复制到 skills 目录）
cp -r extensions/novel-openviking skills/

# 关闭扩展（删除即可）
rm -rf skills/novel-openviking
```

扩展放入 `skills/` 后，Agent 下次对话时自动加载，无需重启。
