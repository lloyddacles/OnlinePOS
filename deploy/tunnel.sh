#!/usr/bin/env bash
#
# Start the local POS server + Cloudflare quick tunnel.
# Prints the public URL clients should use.
#
set -e
cd "$(dirname "$0")/.."

echo "==> Starting POS server on :3000"
if ! curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
  nohup node server.js > /tmp/pos-server.log 2>&1 &
  sleep 2
  echo "    server started (pid $!)"
else
  echo "    already running"
fi

echo "==> Starting Cloudflare tunnel"
if pgrep -f "cloudflared tunnel" >/dev/null 2>&1; then
  echo "    tunnel already running"
else
  nohup ~/bin/cloudflared tunnel --url http://localhost:3000 --no-autoupdate > /tmp/cloudflared.log 2>&1 &
  echo "    tunnel starting..."
  sleep 5
fi

URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/cloudflared.log | head -1)
echo ""
echo "Public link: $URL"
echo ""
echo "Keep this terminal open. To stop: kill %1"
