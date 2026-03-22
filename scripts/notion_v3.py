#!/usr/bin/env python3
"""Write v3 xiaohongshu post to Notion page."""
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

def text_block(content, bold=False):
    rt = {"type": "text", "text": {"content": content}}
    if bold:
        rt["annotations"] = {"bold": True}
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [rt]}}

def heading2(content):
    return {"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": content}}]}}

def divider():
    return {"object": "block", "type": "divider", "divider": {}}

def quote_block(content):
    return {"object": "block", "type": "quote", "quote": {"rich_text": [{"type": "text", "text": {"content": content}}]}}

def api_call(method, path, data=None):
    url = f"https://api.notion.com/v1{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.read().decode()}")
        raise

def append_blocks(blocks):
    """Append blocks in batches of 20."""
    for i in range(0, len(blocks), 20):
        batch = blocks[i:i+20]
        result = api_call("PATCH", f"/blocks/{PAGE_ID}/children", {"children": batch})
        print(f"  Batch {i//20+1}: {len(result.get('results', []))} blocks added")
        time.sleep(0.5)

# Build all blocks
blocks = [
    text_block("朋友问我最近在忙啥。"),
    text_block("我说：批奏折。"),
    text_block("他以为我在开玩笑。"),
    text_block("但我是认真的。"),
    divider(),
    text_block("我是个独立创业者，一个人搞好几个项目。代码要写，财务要算，合同要看，社交媒体要运营，服务器要维护\u2026\u2026"),
    text_block("之前的状态：每天醒来打开 to-do list 就想死。"),
    text_block("现在的状态：每天醒来，AI 已经把该干的都干了，给我发了一份日报，我只需要说\u201c准\u201d或者\u201c驳回\u201d。"),
    text_block("没错，我建了一个 AI 朝廷。", bold=True),
    divider(),
    heading2("怎么搞的？"),
    text_block("我用了一个开源工具叫 Clawdbot，然后按明朝六部制，给每个 AI 分了官职："),
    text_block("\U0001f3db\ufe0f 司礼监 \u2014 大内总管，帮我接旨、传话、调度所有 AI"),
    text_block("\u2694\ufe0f 兵部 \u2014 写代码、搞架构、部署上线"),
    text_block("\U0001f4b0 户部 \u2014 算账、管预算、盯跨境电商"),
    text_block("\u2696\ufe0f 刑部 \u2014 审合同、查合规、防法律坑"),
    text_block("\U0001f3ad 礼部 \u2014 写小红书（对，这篇就是它写的初稿\U0001f602）"),
    text_block("\U0001f527 工部 \u2014 管服务器、搞自动化"),
    text_block("\U0001f4dd 都察院 \u2014 代码审查，质量不过关直接弹劾打回"),
    text_block("它们还会自己开会、互相审核。兵部写完代码，都察院自动审查，不通过就打回重写。"),
    divider(),
    heading2("举个真实例子"),
    text_block("昨天晚上我睡觉前说了一句：\u201c这个新功能明天上线。\u201d"),
    text_block("今天早上醒来："),
    text_block("\u2192 兵部已经写好代码"),
    text_block("\u2192 都察院审核通过"),
    text_block("\u2192 工部部署到服务器"),
    text_block("\u2192 司礼监给我发了汇总：\u300c回禀王Sir，功能已上线，测试通过。\u300d"),
    text_block("我：准。"),
    text_block("全程我只说了两个字。", bold=True),
    divider(),
    heading2("\U0001f4b0 成本"),
    text_block("API 费一个月大概 100-300 块。"),
    text_block("省下来的？一个全职程序员 + 一个运营 + 半个法务 + 半个财务的时间。"),
    divider(),
    heading2("\U0001f3af 区别在哪？"),
    text_block("很多人用 AI 的方式是：打开 ChatGPT \u2192 问一个问题 \u2192 得到答案 \u2192 关掉。"),
    text_block("我的方式是：AI 24 小时在线，主动给我汇报，主动帮我干活，我只在关键节点做决策。"),
    quote_block("一个是工具，一个是团队。"),
    divider(),
    text_block("想搞同款的评论区扣 1，我出个详细教程 \U0001f4e6", bold=True),
    text_block("."),
    text_block("#AI #一人公司 #创业 #效率 #Clawdbot #自动化 #独立开发者 #搞钱 #副业 #生产力工具"),
]

# First delete existing blocks
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

# Write new content
print("Writing v3 content...")
append_blocks(blocks)
print("DONE!")
