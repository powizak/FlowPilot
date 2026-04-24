#!/usr/bin/env bash
# redeploy.sh — rebuild FlowPilot app + web images from scratch and restart
# the full stack on Synology (or any Docker host).
#
# Usage (on the NAS, inside the repo root):
#   git pull
#   sudo ./redeploy.sh                 # rebuild app + web only
#   sudo ./redeploy.sh --all           # rebuild every buildable service
#   sudo ./redeploy.sh --project NAME  # use a specific compose project name
#                                      # (defaults to the DSM-style name "FlowPilot")
#
# What it does:
#   1. Builds the selected services with --no-cache --pull
#   2. Removes any pre-existing containers that match the names declared in
#      docker-compose.yaml (resolves "container name already in use" when
#      Synology Container Manager originally created the stack under a
#      different project name)
#   3. Brings the whole stack back up with --force-recreate --remove-orphans
#   4. Persistent data under ${SYNOLOGY_DATA_ROOT} is never touched, only
#      containers are replaced
#
# Run as a user that can talk to the Docker socket. On DSM that means
# `sudo ./redeploy.sh`.

set -euo pipefail

COMPOSE_FILE="docker-compose.yaml"
PROJECT_NAME="FlowPilot"
SERVICES=(app web)
REBUILD_ALL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)
      REBUILD_ALL=1
      shift
      ;;
    --project)
      PROJECT_NAME="${2:?--project requires a value}"
      shift 2
      ;;
    -h|--help)
      sed -n '2,25p' "$0"
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

cd "$(dirname "$0")"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "ERROR: $COMPOSE_FILE not found in $(pwd)" >&2
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE")
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE")
else
  echo "ERROR: neither 'docker compose' nor 'docker-compose' is available" >&2
  exit 1
fi

# Container names declared with `container_name:` in docker-compose.yaml.
# These are global in Docker, independent of the compose project name, so
# leftover containers from a different project (e.g. DSM Container Manager)
# would block `up -d` with a name conflict. We force-remove them up front.
KNOWN_CONTAINERS=(
  flowpilot-app
  flowpilot-web
  flowpilot-caddy
  flowpilot-postgres
  flowpilot-redis
  flowpilot-minio
  flowpilot-mailhog
)

if [[ $REBUILD_ALL -eq 1 ]]; then
  echo ">>> Rebuilding ALL buildable services without cache"
  "${DC[@]}" build --no-cache --pull
else
  echo ">>> Rebuilding without cache: ${SERVICES[*]}"
  "${DC[@]}" build --no-cache --pull "${SERVICES[@]}"
fi

echo ">>> Removing any pre-existing FlowPilot containers (data volumes are kept)"
for name in "${KNOWN_CONTAINERS[@]}"; do
  if docker ps -a --format '{{.Names}}' | grep -qx "$name"; then
    docker rm -f "$name" >/dev/null
    echo "    removed $name"
  fi
done

echo ">>> Bringing the stack up under project '$PROJECT_NAME'"
"${DC[@]}" up -d --force-recreate --remove-orphans

echo ">>> Current status"
"${DC[@]}" ps

echo ">>> Done. Tail logs with:"
echo "    ${DC[*]} logs -f app web"
