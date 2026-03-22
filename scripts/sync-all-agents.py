import json, glob

main_file = "/home/ubuntu/.openclaw/agents/main/agent/auth-profiles.json"
with open(main_file) as f:
    main_data = json.load(f)

main_profile = main_data["profiles"]["anthropic:claude-cli"]
print("Source token from main agent loaded")

count = 0
for path in glob.glob("/home/ubuntu/.openclaw/agents/*/agent/auth-profiles.json"):
    with open(path) as f:
        data = json.load(f)
    
    if "anthropic:claude-cli" in data.get("profiles", {}):
        data["profiles"]["anthropic:claude-cli"]["access"] = main_profile["access"]
        data["profiles"]["anthropic:claude-cli"]["refresh"] = main_profile["refresh"]
        data["profiles"]["anthropic:claude-cli"]["expires"] = main_profile["expires"]
        
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        
        agent_name = path.split("/agents/")[1].split("/")[0]
        print(f"  Updated: {agent_name}")
        count += 1

print(f"Total: {count} agents updated")
