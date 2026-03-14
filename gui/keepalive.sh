#!/bin/bash
# [L-03] 统一使用 gui/server/keepalive.sh，此文件仅作兼容入口
DIR="$(cd "$(dirname "$0")" && pwd)"
exec bash "$DIR/server/keepalive.sh" "$@"
