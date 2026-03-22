import json, time, sys, glob

resp_file = "/tmp/oauth-response.json"

with open(resp_file) as f:
    response = json.load(f)

if "access_token" not in response:
    print(f"ERROR: {response}")
    sys.exit(1)

new_access = response["access_token"]
new_refresh = response.get("refresh_token")
new_expires = int(time.time() * 1000) + response.get("expires_in", 28800) * 1000

# Update ALL agents in both .openclaw and .clawdbot
count = 0
for base in ["/home/ubuntu/.openclaw", "/home/ubuntu/.clawdbot"]:
    for path in glob.glob(f"{base}/agents/*/agent/auth-profiles.json"):
        with open(path) as f:
            data = json.load(f)
        
        if "anthropic:claude-cli" in data.get("profiles", {}):
            data["profiles"]["anthropic:claude-cli"]["access"] = new_access
            if new_refresh:
                data["profiles"]["anthropic:claude-cli"]["refresh"] = new_refresh
            data["profiles"]["anthropic:claude-cli"]["expires"] = new_expires
            
            with open(path, "w") as f:
                json.dump(data, f, indent=2)
            count += 1

hours = response.get("expires_in", 0) // 3600
print(f"Token refreshed for {count} agents. Expires in {hours}h")
