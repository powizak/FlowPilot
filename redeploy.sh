#!/usr/bin/env bash
# redeploy.sh — rebuild FlowPilot app + web images from scratch and restart
# the stack on Synology (or any Docker host).
#
# Usage (on the NAS, inside the repo root):
#   git pull
#   ./redeploy.sh
#
# What it does:
#   1. Builds `app` and `web` with --no-cache --pull (fresh layers, fresh base)
#   2. Recreates only the containers whose image changed
#   3. Leaves postgres / redis / minio / mailhog / caddy untouched
#   4. Data volumes under ${SYNOLOGY_DATA_ROOT} are never touched
#
# Run as a user that can talk to the Docker socket. On DSM that usually
# means `sudo ./redeploy.sh`.

set -euo pipefail

COMPOSE_FILE="docker-compose.yaml"
SERVICES=(app web)

cd "$(dirname "$0")"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "ERROR: $COMPOSE_FILE not found in $(pwd)" >&2
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  echo "ERROR: neither 'docker compose' nor 'docker-compose' is available" >&2
  exit 1
fi

echo ">>> Rebuilding images without cache: ${SERVICES[*]}"
"${DC[@]}" -f "$COMPOSE_FILE" build --no-cache --pull "${SERVICES[@]}"

echo ">>> Recreating changed containers"
"${DC[@]}" -f "$COMPOSE_FILE" up -d "${SERVICES[@]}"

echo ">>> Current status"
"${DC[@]}" -f "$COMPOSE_FILE" ps

echo ">>> Done. Tail logs with:"
echo "    ${DC[*]} -f $COMPOSE_FILE logs -f app web"
