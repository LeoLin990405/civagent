#!/bin/bash
# Boluo GUI keepalive — checks every 15s, restarts if dead
DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="/tmp/boluo-gui.log"

while true; do
  if ! curl -s -o /dev/null -w "" http://localhost:18795/api/health 2>/dev/null; then
    echo "$(date -u): Server down, restarting..." >> "$LOG"
    cd "$DIR" && nohup node server/index.js >> "$LOG" 2>&1 &
    sleep 3
  fi
  sleep 15
done
