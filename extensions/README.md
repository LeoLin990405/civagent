# Extensions - 可选插件

本目录包含**默认不启用**的 OpenClaw 插件。通过 `openclaw plugins install` 安装。

## 可用插件

| 插件 | 说明 | 前置依赖 |
|------|------|---------|
| [novel-openviking](./novel-openviking/) | 翰林院 OpenViking 增强：语义搜索 + 知识图谱 | OpenViking 已安装 |

## 安装

```bash
# 安装插件
openclaw plugins install ./extensions/novel-openviking

# 启用 / 关闭
openclaw plugins enable novel-openviking
openclaw plugins disable novel-openviking

# 查看已安装
openclaw plugins list
```

插件启用后，翰林院 agent 自动获得 OpenViking 增强 skill，知道如何调用语义搜索和索引。关闭插件后 skill 消失，agent 自然回退到纯文件模式。
