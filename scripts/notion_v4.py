#!/usr/bin/env python3
"""Write v4 xiaohongshu post - human voice, specific details."""
import json
import time
import urllib.request

NOTION_KEY = __import__("os").environ.get("NOTION_KEY", "")
if not NOTION_KEY:
    raise SystemExit("Error: NOTION_KEY environment variable not set")
PAGE_ID = "30d90cde52d48101bd9ae06f938a8066"
HEADERS = {
    "Authorization": f"Bearer {NOTION_KEY}",
    "Notion-Version": "2025-09-03",
    "Content-Type": "application/json",
}

def t(content):
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": content}}]}}

def tb(content):
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": content}, "annotations": {"bold": True, "italic": False, "strikethrough": False, "underline": False, "code": False, "color": "default"}}]}}

def h2(content):
    return {"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": content}}]}}

def div():
    return {"object": "block", "type": "divider", "divider": {}}

def q(content):
    return {"object": "block", "type": "quote", "quote": {"rich_text": [{"type": "text", "text": {"content": content}}]}}

def api_call(method, path, data=None):
    url = f"https://api.notion.com/v1{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def append_blocks(blocks):
    for i in range(0, len(blocks), 20):
        batch = blocks[i:i+20]
        result = api_call("PATCH", f"/blocks/{PAGE_ID}/children", {"children": batch})
        print(f"  Batch {i//20+1}: {len(result.get('results', []))} blocks added")
        time.sleep(0.5)

blocks = [
    t("先说背景。我同时在搞好几个项目，有小程序、有跨境电商、有SaaS，基本上就是一个人当五个人用。"),
    t("我是重度 vibe coding 患者。就是那种不想写代码、只想跟AI说需求然后它帮我写的人。之前一直用 Cursor，体验确实不错，但有个致命问题："),
    tb("只能在电脑前用。"),
    t("我经常在外面跑，地铁上、咖啡厅、甚至蹲坑的时候突然有个想法，想让AI帮我改几行代码。掏出手机一看——Cursor 没有手机版。"),
    t("忍了很久。"),
    div(),
    h2("转折点"),
    t("后来发现了两个东西：Claude Code 和 Clawdbot。"),
    t("Claude Code 是 Anthropic 出的命令行编程工具，跑在服务器上，不需要 IDE。Clawdbot 是一个 AI agent 框架，可以通过 Discord、Signal 这些聊天工具跟 AI 对话，然后 AI 在服务器上帮你干活。"),
    t("关键来了：这俩配在一起，就等于我拿手机发条消息，服务器上的 Claude Code 就开始帮我写代码了。"),
    tb("手机 vibe coding，实现了。"),
    div(),
    h2("白嫖了个服务器"),
    t("Oracle Cloud 有个永久免费的 ARM 服务器，4核24G内存，白嫖的。我直接在上面装了 Claude Code 和 Clawdbot。"),
    t("成本：服务器 0 元。"),
    t("然后我就想，既然服务器上有个24小时在线的AI，那干嘛只让它写代码呢？"),
    div(),
    h2("于是我搞了个朝廷"),
    t("Clawdbot 支持跑多个 agent，我就按明朝六部的路子，给每个 agent 分了工："),
    t("写代码的叫兵部，管服务器的叫工部，审合同的叫刑部，搞社交媒体的叫礼部\u2026\u2026还搞了个都察院专门审查代码质量，写得不行直接打回。"),
    t("最上面有个总调度叫司礼监，我跟它说话就行，它自己分配任务。"),
    t("每天早上给我发日报，每周发周报。我批个\u201c准\u201d字就完事了。"),
    t("朋友问我在干嘛，我说在批奏折，他以为我在开玩笑\U0001f602"),
    div(),
    h2("模型搭配（这个省了不少钱）"),
    t("一开始全用 Claude Opus，一天烧了几十块，肉疼。"),
    t("后来摸索出一套搭配："),
    t("\u2022 日常对话、任务分发：用 Claude Sonnet，快而且便宜"),
    t("\u2022 写代码、审合同、做分析：用 Claude Opus，贵但是真的强"),
    t("\u2022 写文案、回消息、整理笔记：用 Qwen，国产模型够用还几乎不花钱"),
    t("这样一个月 API 费大概 100-300 块。之前光 Cursor 订阅就要 20 刀/月了。"),
    div(),
    h2("Notion 是真香"),
    t("Clawdbot 接了 Notion API，现在我的日报周报月报全自动生成，直接写进 Notion 数据库。"),
    t("项目进度、财务数据、待办清单，全在一个 dashboard 里。以前我最头疼的就是整理这些东西，现在完全不用管了。"),
    t("AI 干完活自己写报告，我打开 Notion 一看，清清楚楚。"),
    div(),
    h2("三天搭完的"),
    t("说实话没想象中复杂："),
    t("第一天：白嫖 Oracle 服务器，装好 Claude Code + Clawdbot"),
    t("第二天：配好各个 agent 的分工和人设，调通协作流程"),
    t("第三天：接上 Notion，跑通第一个完整的\u201c下旨\u2192干活\u2192交差\u201d流程"),
    t("现在每天的状态就是：起床看日报，批几个奏折，该干嘛干嘛去。晚上再看看有没有需要处理的。"),
    t("之前一个人干六个人的活，现在六个AI给我干活。成本不到一杯咖啡/天。"),
    div(),
    t("想看详细配置教程的评论区扣 1 \U0001f4e6"),
    t("."),
    t("#AI #Clawdbot #vibecoding #一人公司 #创业 #自动化 #效率 #独立开发者 #ClaudeCode #生产力工具"),
]

# Delete existing
print("Deleting existing blocks...")
result = api_call("GET", f"/blocks/{PAGE_ID}/children?page_size=100", None)
existing = [b["id"] for b in result.get("results", [])]
for bid in existing:
    try:
        api_call("DELETE", f"/blocks/{bid}", None)
    except:
        pass
    time.sleep(0.3)
print(f"  Deleted {len(existing)} blocks")

print("Writing v4 content...")
append_blocks(blocks)
print("DONE!")
