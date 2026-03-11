#!/bin/bash
set -euo pipefail

# CivAgent — Regime Switcher
# Usage: ./scripts/switch-regime.sh china/qin

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REGIMES_DIR="$PROJECT_DIR/regimes"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

usage() {
    echo -e "${CYAN}CivAgent — Regime Switcher${NC}"
    echo ""
    echo "Usage: $0 <region/regime_id>"
    echo ""
    echo "Examples:"
    echo "  $0 china/tang     # Switch to Tang Dynasty (三省六部制)"
    echo "  $0 china/qin      # Switch to Qin Dynasty (三公九卿制)"
    echo "  $0 global/athens  # Switch to Athenian Democracy"
    echo ""
    echo "Run ./scripts/list-regimes.sh to see all available regimes."
    exit 1
}

if [ $# -lt 1 ]; then
    usage
fi

REGIME_PATH="$1"
REGIME_DIR="$REGIMES_DIR/$REGIME_PATH"

# Validate regime exists
if [ ! -d "$REGIME_DIR" ]; then
    echo -e "${RED}✖ Regime not found: $REGIME_PATH${NC}"
    echo "  Directory does not exist: $REGIME_DIR"
    echo ""
    echo "Available regimes:"
    "$SCRIPT_DIR/list-regimes.sh" 2>/dev/null || find "$REGIMES_DIR" -name "metadata.json" -exec dirname {} \; | sed "s|$REGIMES_DIR/||" | sort
    exit 1
fi

# Check for metadata.json
METADATA="$REGIME_DIR/metadata.json"
if [ ! -f "$METADATA" ]; then
    echo -e "${RED}✖ No metadata.json found in $REGIME_PATH${NC}"
    echo "  This regime may not be fully configured yet."
    exit 1
fi

# Read metadata
REGIME_NAME_ZH=$(python3 -c "import json; d=json.load(open('$METADATA')); print(d['name']['zh'])" 2>/dev/null || echo "Unknown")
REGIME_NAME_EN=$(python3 -c "import json; d=json.load(open('$METADATA')); print(d['name']['en'])" 2>/dev/null || echo "Unknown")
REGIME_ERA=$(python3 -c "import json; d=json.load(open('$METADATA')); print(d['era']['en'])" 2>/dev/null || echo "Unknown")
REGIME_SYSTEM=$(python3 -c "import json; d=json.load(open('$METADATA')); print(d['system']['en'])" 2>/dev/null || echo "Unknown")
AGENT_COUNT=$(python3 -c "import json; d=json.load(open('$METADATA')); print(d['agentCount'])" 2>/dev/null || echo "?")

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  CivAgent — Switching Regime${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Regime:  ${GREEN}$REGIME_NAME_ZH${NC} ($REGIME_NAME_EN)"
echo -e "  Era:     $REGIME_ERA"
echo -e "  System:  $REGIME_SYSTEM"
echo -e "  Agents:  $AGENT_COUNT"
echo ""

# Detect OpenClaw config directory
OPENCLAW_DIR="${OPENCLAW_HOME:-$HOME/.openclaw}"
if [ ! -d "$OPENCLAW_DIR" ]; then
    # Try clawdbot
    OPENCLAW_DIR="$HOME/.clawdbot"
fi

if [ ! -d "$OPENCLAW_DIR" ]; then
    echo -e "${YELLOW}⚠ OpenClaw directory not found at ~/.openclaw or ~/.clawdbot${NC}"
    echo "  Creating ~/.openclaw..."
    mkdir -p "$OPENCLAW_DIR"
fi

# Backup current config
BACKUP_DIR="$OPENCLAW_DIR/backups/$(date +%Y%m%d_%H%M%S)"
if [ -f "$OPENCLAW_DIR/SOUL.md" ] || [ -f "$OPENCLAW_DIR/IDENTITY.md" ]; then
    echo -e "${YELLOW}→ Backing up current config to $BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
    [ -f "$OPENCLAW_DIR/SOUL.md" ] && cp "$OPENCLAW_DIR/SOUL.md" "$BACKUP_DIR/"
    [ -f "$OPENCLAW_DIR/IDENTITY.md" ] && cp "$OPENCLAW_DIR/IDENTITY.md" "$BACKUP_DIR/"
    [ -f "$OPENCLAW_DIR/openclaw.json" ] && cp "$OPENCLAW_DIR/openclaw.json" "$BACKUP_DIR/"
    echo -e "${GREEN}✓ Backup saved${NC}"
fi

# Copy SOUL.md
if [ -f "$REGIME_DIR/SOUL.md" ]; then
    cp "$REGIME_DIR/SOUL.md" "$OPENCLAW_DIR/SOUL.md"
    echo -e "${GREEN}✓ SOUL.md deployed${NC}"
else
    echo -e "${YELLOW}⚠ No SOUL.md found in regime${NC}"
fi

# Copy IDENTITY.md
if [ -f "$REGIME_DIR/IDENTITY.md" ]; then
    cp "$REGIME_DIR/IDENTITY.md" "$OPENCLAW_DIR/IDENTITY.md"
    echo -e "${GREEN}✓ IDENTITY.md deployed${NC}"
else
    echo -e "${YELLOW}⚠ No IDENTITY.md found in regime${NC}"
fi

# Handle openclaw.json.template
TEMPLATE="$REGIME_DIR/openclaw.json.template"
if [ -f "$TEMPLATE" ]; then
    EXISTING_CONFIG="$OPENCLAW_DIR/openclaw.json"
    if [ -f "$EXISTING_CONFIG" ]; then
        echo -e "${YELLOW}→ Merging openclaw.json.template with existing config...${NC}"
        # Extract existing API keys and tokens using python3
        python3 << 'PYEOF'
import json, sys, os

template_path = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('TEMPLATE')
existing_path = sys.argv[2] if len(sys.argv) > 2 else os.environ.get('EXISTING_CONFIG')
output_path = sys.argv[3] if len(sys.argv) > 3 else os.environ.get('OUTPUT_PATH')

try:
    with open(template_path) as f:
        template = json.load(f)
    with open(existing_path) as f:
        existing = json.load(f)

    # Preserve API keys from existing config
    if 'models' in existing and 'providers' in existing['models']:
        for provider, config in existing['models']['providers'].items():
            if provider in template.get('models', {}).get('providers', {}):
                if 'apiKey' in config:
                    template['models']['providers'][provider]['apiKey'] = config['apiKey']
                if 'baseUrl' in config:
                    template['models']['providers'][provider]['baseUrl'] = config['baseUrl']

    # Preserve Discord tokens
    if 'channels' in existing and 'discord' in existing['channels']:
        if 'accounts' in existing['channels']['discord']:
            if 'channels' not in template:
                template['channels'] = {}
            if 'discord' not in template['channels']:
                template['channels']['discord'] = {}
            template['channels']['discord']['accounts'] = existing['channels']['discord']['accounts']

    with open(output_path, 'w') as f:
        json.dump(template, f, indent=2, ensure_ascii=False)

    print("✓ Config merged successfully")
except Exception as e:
    print(f"⚠ Merge failed: {e}", file=sys.stderr)
    print("  Copying template as-is. You'll need to add API keys manually.")
    import shutil
    shutil.copy(template_path, output_path)
PYEOF
    else
        echo -e "${YELLOW}→ No existing config found. Copying template as-is.${NC}"
        echo -e "${YELLOW}  You'll need to add API keys to $EXISTING_CONFIG${NC}"
        cp "$TEMPLATE" "$OPENCLAW_DIR/openclaw.json"
    fi
    echo -e "${GREEN}✓ openclaw.json configured${NC}"
else
    echo -e "${YELLOW}⚠ No openclaw.json.template found in regime${NC}"
fi

# Write active regime marker
echo "$REGIME_PATH" > "$OPENCLAW_DIR/.active-regime"
echo -e "${GREEN}✓ Active regime set to: $REGIME_PATH${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ Regime switched to $REGIME_NAME_ZH ($REGIME_NAME_EN)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit $OPENCLAW_DIR/openclaw.json to add your API keys"
echo "  2. Restart the gateway: openclaw gateway restart"
echo "  3. Test with your messaging platform"
