#!/bin/bash
set -euo pipefail

# CivAgent — List All Regimes

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REGIMES_DIR="$PROJECT_DIR/regimes"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
DIM='\033[2m'
NC='\033[0m'

# Detect active regime
OPENCLAW_DIR="${OPENCLAW_HOME:-$HOME/.openclaw}"
ACTIVE_REGIME=""
if [ -f "$OPENCLAW_DIR/.active-regime" ]; then
    ACTIVE_REGIME=$(cat "$OPENCLAW_DIR/.active-regime")
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  CivAgent — Regime Catalog${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

print_regime() {
    local regime_path="$1"
    local metadata="$REGIMES_DIR/$regime_path/metadata.json"
    local marker=""

    if [ "$regime_path" = "$ACTIVE_REGIME" ]; then
        marker=" ◀ ACTIVE"
    fi

    if [ -f "$metadata" ]; then
        local name_zh name_en era system agents
        name_zh=$(python3 -c "import json; d=json.load(open('$metadata')); print(d['name']['zh'])" 2>/dev/null || echo "?")
        name_en=$(python3 -c "import json; d=json.load(open('$metadata')); print(d['name']['en'])" 2>/dev/null || echo "?")
        era=$(python3 -c "import json; d=json.load(open('$metadata')); print(d['era']['en'])" 2>/dev/null || echo "?")
        system=$(python3 -c "import json; d=json.load(open('$metadata')); print(d['system']['en'])" 2>/dev/null || echo "?")
        agents=$(python3 -c "import json; d=json.load(open('$metadata')); print(d['agentCount'])" 2>/dev/null || echo "?")
        printf "  %-25s %-8s %-20s %-35s %s agents%s\n" "$name_zh ($name_en)" "" "$era" "$system" "$agents" "$marker"
    else
        printf "  %-25s ${DIM}(not configured)${NC}\n" "$regime_path"
    fi
}

# Chinese Dynasties
echo -e "${GREEN}中华朝代 / Chinese Dynasties (20)${NC}"
echo -e "${DIM}──────────────────────────────────────────────────────────────────────────────${NC}"
for dir in $(find "$REGIMES_DIR/china" -mindepth 1 -maxdepth 1 -type d | sort); do
    regime_id=$(basename "$dir")
    print_regime "china/$regime_id"
done

echo ""

# Global Empires
echo -e "${GREEN}世界帝国 / Global Empires (37)${NC}"
echo -e "${DIM}──────────────────────────────────────────────────────────────────────────────${NC}"
for dir in $(find "$REGIMES_DIR/global" -mindepth 1 -maxdepth 1 -type d | sort); do
    regime_id=$(basename "$dir")
    print_regime "global/$regime_id"
done

echo ""

# Summary
total_configured=$(find "$REGIMES_DIR" -name "metadata.json" -not -path "*/_template/*" | wc -l | tr -d ' ')
total_dirs=$(find "$REGIMES_DIR" -mindepth 2 -maxdepth 2 -type d -not -name "_template" | wc -l | tr -d ' ')
echo -e "${CYAN}Total: $total_configured/$total_dirs regimes configured${NC}"
if [ -n "$ACTIVE_REGIME" ]; then
    echo -e "${GREEN}Active: $ACTIVE_REGIME${NC}"
fi
echo ""
echo "Switch regime: ./scripts/switch-regime.sh <region/id>"
echo "Validate:      ./scripts/validate-regime.sh <region/id>"
