#!/bin/bash
set -euo pipefail

# CivAgent — Regime Scaffolder
# Creates a new regime from the template

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REGIMES_DIR="$PROJECT_DIR/regimes"
TEMPLATE_DIR="$REGIMES_DIR/_template"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ $# -lt 1 ]; then
    echo "Usage: $0 <region/regime_id>"
    echo ""
    echo "Examples:"
    echo "  $0 china/western-han"
    echo "  $0 global/carthage"
    exit 1
fi

REGIME_PATH="$1"
REGIME_DIR="$REGIMES_DIR/$REGIME_PATH"

if [ -d "$REGIME_DIR" ] && [ "$(ls -A "$REGIME_DIR")" ]; then
    echo -e "${RED}✖ Regime directory already exists and is not empty: $REGIME_DIR${NC}"
    echo "  Delete it first if you want to recreate."
    exit 1
fi

echo -e "${CYAN}Creating regime scaffold: $REGIME_PATH${NC}"

mkdir -p "$REGIME_DIR"

# Copy template files
for file in metadata.json openclaw.json.template SOUL.md IDENTITY.md README.md; do
    if [ -f "$TEMPLATE_DIR/$file" ]; then
        cp "$TEMPLATE_DIR/$file" "$REGIME_DIR/$file"
        echo -e "${GREEN}✓ Created $file${NC}"
    fi
done

echo ""
echo -e "${GREEN}✓ Regime scaffold created at: $REGIME_DIR${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit metadata.json with regime details"
echo "  2. Design agent architecture in openclaw.json.template"
echo "  3. Write SOUL.md with era-appropriate behavioral rules"
echo "  4. Write IDENTITY.md with org chart and role mapping"
echo "  5. Write README.md with description and usage"
echo "  6. Validate: ./scripts/validate-regime.sh $REGIME_PATH"
