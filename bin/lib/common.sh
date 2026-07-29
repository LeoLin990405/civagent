# shellcheck shell=bash
# CivAgent CLI shared helpers — sourced by bin/civagent, not run directly.
#
# Provides: color constants, die(), validate_regime(), require_regime_metadata(),
# and metadata_fields() — a single-shot metadata.json reader that replaces the
# old "one python3 subprocess per field" pattern.

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# Print a message to stdout and exit 1 (the canonical `{ echo ...; exit 1; }`
# idiom, factored out). Messages must not rely on stderr.
die() {
  echo "$*"
  exit 1
}

# Regime ids are interpolated into paths and passed to interpreters; reject
# anything outside <region>/<kebab-id> before it reaches them.
validate_regime() {
  [[ "$1" =~ ^(china|global)/[a-z0-9][a-z0-9-]*$ ]] || {
    echo "Invalid regime id: $1 (expected china/<id> or global/<id>)"; exit 1;
  }
}

# Ensure a regime dir actually contains metadata.json.
# $1 = regime id (used in the message), $2 = regime dir.
require_regime_metadata() {
  [[ -f "$2/metadata.json" ]] || { echo "Regime not found: $1"; exit 1; }
}

# Read a regime's metadata.json in ONE python invocation instead of one per
# field. The program is a constant string; the file path is passed via
# sys.argv, never interpolated into the program text. Emits name.zh, name.en,
# era.zh, era.en, orchestrationPattern, agentCount separated by \x1f (unit
# separator — unlike tab it is not IFS whitespace, so empty fields survive
# `read`). Corrupt or missing files degrade to the same fallbacks the old
# per-field callers used ("" for names/eras, "?" for pattern/agentCount) and
# never raise.
_CIVAGENT_METADATA_PY='
import json, sys
try:
    with open(sys.argv[1]) as fh:
        data = json.load(fh)
except Exception:
    data = {}
if not isinstance(data, dict):
    data = {}
name = data.get("name")
era = data.get("era")
if not isinstance(name, dict):
    name = {}
if not isinstance(era, dict):
    era = {}
print(name.get("zh", ""), name.get("en", ""), era.get("zh", ""),
      era.get("en", ""), data.get("orchestrationPattern", "?"),
      data.get("agentCount", "?"), sep="\x1f")
'

# Read the standard metadata fields for $1 (a metadata.json path) with a
# single python subprocess and set:
#   META_NAME_ZH META_NAME_EN META_ERA_ZH META_ERA_EN META_PATTERN META_AGENTS
# Missing/corrupt data yields "" (pattern/agents "?"), matching the historical
# per-field fallbacks.
metadata_fields() {
  local _out
  _out=$(python3 -c "$_CIVAGENT_METADATA_PY" "$1" 2>/dev/null) || _out=""
  local _us=$'\x1f'
  local _nz _ne _ez _ee _pat _ag
  IFS="$_us" read -r _nz _ne _ez _ee _pat _ag <<< "$_out"
  META_NAME_ZH="$_nz"; META_NAME_EN="$_ne"
  META_ERA_ZH="$_ez"; META_ERA_EN="$_ee"
  META_PATTERN="$_pat"; META_AGENTS="$_ag"
}
