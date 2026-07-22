#!/bin/bash
set -euo pipefail

# Entrypoint for the Intelekt-CLI compute session service.
# Starts the session WebSocket server that bridges the CLI's streaming-json
# output to the relay-gateway. The native CLI agent loop is never intercepted.

SESSION_ID="${INTELEKT_SESSION_ID:-unknown}"
PORT="${PORT:-8080}"

echo "Intelekt-CLI session service starting (session: $SESSION_ID, port: $PORT)"

# Install ws if not available (it is in the image but just in case)
if ! node -e "require('ws')" 2>/dev/null; then
  npm install -g ws 2>/dev/null || true
fi

exec node /opt/session-server.js
