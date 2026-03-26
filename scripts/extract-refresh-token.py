import json
with open("/home/ubuntu/.openclaw/agents/main/agent/auth-profiles.json") as f:
    d = json.load(f)
print(d["profiles"]["anthropic:claude-cli"]["refresh"])
