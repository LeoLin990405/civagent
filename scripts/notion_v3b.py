#!/usr/bin/env python3
"""Write v3b xiaohongshu post to Notion page - humorous, assumes clawdbot knowledge."""
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
        rt["annotations"] = {"bold": True, "italic": False, "strikethrough": False, "underline": False, "code": False, "color": "default"}
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
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def append_blocks(blocks):
    for i in range(0, len(blocks), 20):
        batch = blocks[i:i+20]
        result = api_call("PATCH", f"/blocks/{PAGE_ID}/children", {"children": batch})
        print(f"  Batch {i//20+1}: {len(result.get('results', []))} blocks added")
        time.sleep(0.5)

blocks = [
    text_block("事情是这样的。"),
    text_block("装完 Clawdbot 之后我就在想：一个 agent 不够用啊，我一个人搞这么多项目，一个 AI 管不过来。"),
    text_block("然后我脑子一抽：要不搞个朝廷？"),
    text_block("于是我真搞了。"),
    divider(),
    heading2("\U0001f3db\ufe0f 朝廷怎么搭的"),
    text_block("Clawdbot 支持多 agent，每个 agent 可以有自己的人设、工具、权限。我就按明朝六部制，给每个 agent 分了官职："),
    text_block("\u2694\ufe0f 兵部 \u2014 Opus 模型，专管写代码。给它配了 GitHub、服务器 SSH，它能自己 commit、自己 deploy。写完代码还会跑测试，测试不过自己改。"),
    text_block("\U0001f4b0 户部 \u2014 管钱的。跨境电商选品、成本核算、利润分析。给它接了几个数据源，每周自动出财务简报。"),
    text_block("\u2696\ufe0f 刑部 \u2014 法务合规。合同丢给它，5 分钟标出所有风险条款。之前找律师要几千块的事，现在 3 毛钱 API 搞定。"),
    text_block("\U0001f3ad 礼部 \u2014 社交媒体运营。对，你现在看的这篇就是礼部写的初稿，然后工部和翰林院帮忙改的\U0001f602"),
    text_block("\U0001f527 工部 \u2014 运维。服务器挂了它自己修，SSL 到期它自己续，日志异常它主动告警。半夜三点的 oncall 终于不用我接了。"),
    text_block("\U0001f4dd 都察院 \u2014 这个最损。专门弹劾其他 agent。兵部写的代码，都察院逐行审查，发现 bug 直接打回，附弹劾清单。"),
    divider(),
    heading2("\U0001f451 最骚的是司礼监"),
    text_block("我搞了个总调度 agent 叫司礼监，用 Sonnet 模型（便宜快）。所有任务先过它，它判断该派给谁，然后分发下去。"),
    text_block("我跟它说话就像批奏折："),
    quote_block("我：\u201c这个功能上线。\u201d\n司礼监：\u201c遵旨。已派兵部开发、都察院候审、工部待部署。\u201d"),
    text_block("第二天早上："),
    quote_block("司礼监：\u201c回禀王Sir，兵部已完成开发，都察院审核通过，工部已部署上线，全部测试通过。\u201d\n我：\u201c准。\u201d"),
    text_block("全程两个字。爽到离谱。"),
    divider(),
    heading2("\U0001f4ac 它们还会互相吵架"),
    text_block("有一次兵部赶工期，代码写得糙，都察院直接弹劾："),
    quote_block("\u201c兵部此次提交代码质量低劣，变量命名混乱，缺少错误处理，建议驳回重写。附弹劾清单如下\u2026\u2026\u201d"),
    text_block("兵部不服，改完又提交，都察院又打回。来回三轮才通过。"),
    text_block("我全程没说话，喝着咖啡看它们吵。这就是当皇帝的快乐\U0001f451"),
    divider(),
    heading2("\U0001f4ca 三天搭完，效果拉满"),
    text_block("Day 1\ufe0f\u20e3 装 Clawdbot + 配好 6 个 agent 的人设和工具"),
    text_block("Day 2\ufe0f\u20e3 调通 agent 之间的协作流程 + Notion 奏报系统"),
    text_block("Day 3\ufe0f\u20e3 跑通第一个完整流程：从下旨到交付"),
    text_block("现在每天的工作流：起床 \u2192 看日报 \u2192 批几个奏折 \u2192 刷手机 \u2192 晚上看周报"),
    text_block("之前一个人干 6 个人的活。现在 6 个 AI 给我干活，我负责当皇帝\U0001f60e"),
    divider(),
    heading2("\U0001f4a1 几个踩坑经验"),
    text_block("1\ufe0f\u20e3 模型别全用贵的。日常调度用 Sonnet（快+便宜），重活用 Opus（强但贵）。我一个月 API 费 100-300 块。"),
    text_block("2\ufe0f\u20e3 一定要搞个\u201c都察院\u201d。没有审核的 AI 团队就是草台班子，代码质量会塌。"),
    text_block("3\ufe0f\u20e3 汇报机制很重要。让 AI 主动给你发日报/周报，别等你去问。当皇帝要的是奏折，不是自己下地干活。"),
    text_block("4\ufe0f\u20e3 别 micromanage。说\u201c把这个功能做了\u201d，别说\u201c先建个文件叫 xxx，然后写个函数叫 xxx\u201d。你是皇帝，不是包工头。"),
    divider(),
    text_block("评论区扣 1，出详细配置教程 \U0001f4e6", bold=True),
    text_block("."),
    text_block("#AI #Clawdbot #一人公司 #创业 #自动化 #效率 #独立开发者 #搞钱 #副业 #生产力工具"),
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

print("Writing v3b content...")
append_blocks(blocks)
print("DONE!")
