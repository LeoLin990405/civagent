# 📝 接入 Notion（自动归档）

AI 朝廷可以通过 Notion Skill 自动写日报、归档数据、管理知识库。配置只需 3 步。

---

## 第一步：创建 Notion Integration

1. 访问 [Notion Integrations](https://www.notion.so/profile/integrations)
2. 点击 **New integration**
3. 填写名称（如「AI 朝廷」），选择关联的 Workspace
4. 创建后复制 **Internal Integration Secret**（格式 `ntn_xxx` 或 `secret_xxx`）

## 第二步：存储 API Key

```bash
mkdir -p ~/.config/notion
echo "ntn_你的token" > ~/.config/notion/api_key
```

## 第三步：授权页面/数据库

> ⚠️ 这一步**很关键**，不做的话 API 会返回 404！

1. 打开你想让 AI 访问的 Notion 页面或数据库
2. 点击右上角 **`···`** → **Connect to**
3. 选择你刚创建的 Integration 名称
4. 子页面会自动继承权限

> 每个要访问的顶级页面/数据库都需要手动授权一次。

## 验证

```bash
NOTION_KEY=$(cat ~/.config/notion/api_key)
curl -s "https://api.notion.com/v1/users/me" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" | head -c 200
```

返回 JSON 包含 Integration 名称 = 配置成功。

## 使用示例

```
@司礼监 把今天的工作总结写到 Notion 日报里
@户部 创建一个新的财务数据库，字段包含日期、收入、支出、备注
@礼部 把这周的社媒数据更新到 Notion 舆情表
```

## 数据库字段设计建议

| 数据库 | 核心字段 | 说明 |
|--------|----------|------|
| 起居注（日报） | 日期、工作内容、问题、明日计划 | 每日快速记录 |
| 朔望录（周报） | 周次、开始日期、结束日期、总结 | 每周汇总 |
| 列传（项目） | 项目名、状态、进度、负责人 | 项目追踪 |
| 食货表（财务） | 日期、类别、金额、备注 | 财务记录 |
| 天工志（技术） | 标题、分类、标签、内容 | 技术文档 |

> 💡 Notion 适合做**持久化存档**（日报/周报/知识库），Discord 适合做**实时交互**，两者配合效果最佳。
>
> 📖 Notion API 文档：[developers.notion.com](https://developers.notion.com)

---

← [返回 README](../README.md)
