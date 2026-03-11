#!/bin/bash
set -euo pipefail

# CivAgent — Regime Validator

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REGIMES_DIR="$PROJECT_DIR/regimes"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ $# -lt 1 ]; then
    echo "Usage: $0 <region/regime_id>"
    echo "Example: $0 china/qin"
    exit 1
fi

REGIME_PATH="$1"
REGIME_DIR="$REGIMES_DIR/$REGIME_PATH"
ERRORS=0
WARNINGS=0

echo "Validating regime: $REGIME_PATH"
echo "────────────────────────────────"

# Check directory exists
if [ ! -d "$REGIME_DIR" ]; then
    echo -e "${RED}✖ Directory not found: $REGIME_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Directory exists${NC}"

# Check required files
for file in metadata.json openclaw.json.template SOUL.md IDENTITY.md README.md; do
    if [ -f "$REGIME_DIR/$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✖ $file missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# Validate metadata.json
METADATA="$REGIME_DIR/metadata.json"
if [ -f "$METADATA" ]; then
    # Check JSON validity
    if python3 -c "import json; json.load(open('$METADATA'))" 2>/dev/null; then
        echo -e "${GREEN}✓ metadata.json is valid JSON${NC}"

        # Check required fields
        for field in id name era region system agentCount tags orchestrationPattern; do
            if python3 -c "import json; d=json.load(open('$METADATA')); assert '$field' in d" 2>/dev/null; then
                echo -e "${GREEN}  ✓ Field '$field' present${NC}"
            else
                echo -e "${RED}  ✖ Field '$field' missing${NC}"
                ERRORS=$((ERRORS + 1))
            fi
        done

        # Check bilingual fields
        for field in name era system; do
            for lang in zh en; do
                if python3 -c "import json; d=json.load(open('$METADATA')); assert '$lang' in d['$field']" 2>/dev/null; then
                    :
                else
                    echo -e "${YELLOW}  ⚠ Field '$field.$lang' missing${NC}"
                    WARNINGS=$((WARNINGS + 1))
                fi
            done
        done
    else
        echo -e "${RED}✖ metadata.json is invalid JSON${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Validate openclaw.json.template
TEMPLATE="$REGIME_DIR/openclaw.json.template"
if [ -f "$TEMPLATE" ]; then
    if python3 -c "import json; json.load(open('$TEMPLATE'))" 2>/dev/null; then
        echo -e "${GREEN}✓ openclaw.json.template is valid JSON${NC}"

        # Check for agents
        agent_count=$(python3 -c "import json; d=json.load(open('$TEMPLATE')); print(len(d.get('agents',{}).get('list',[])))" 2>/dev/null || echo 0)
        echo -e "${GREEN}  ✓ $agent_count agents defined${NC}"
    else
        echo -e "${RED}✖ openclaw.json.template is invalid JSON${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Check SOUL.md is not empty template
if [ -f "$REGIME_DIR/SOUL.md" ]; then
    if grep -q '{{' "$REGIME_DIR/SOUL.md"; then
        echo -e "${YELLOW}⚠ SOUL.md still contains {{placeholders}}${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Summary
echo ""
echo "────────────────────────────────"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Regime '$REGIME_PATH' is valid!${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Regime '$REGIME_PATH' has $WARNINGS warning(s) but no errors${NC}"
else
    echo -e "${RED}✖ Regime '$REGIME_PATH' has $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    exit 1
fi
