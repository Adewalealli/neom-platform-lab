# Source this file from Bash: source ./scripts/session.sh
# No containers are started, stopped, deleted, or reconfigured by this file.
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  printf '%s\n' 'Use: source ./scripts/session.sh' >&2
  exit 1
fi
NEOM_LAB_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd) || return 1
for tool in docker.exe wslpath; do
  command -v "$tool" >/dev/null || { printf 'Missing command: %s\n' "$tool" >&2; return 1; }
done
if [[ ! -f "$NEOM_LAB_ROOT/.env" ]]; then
  NEOM_PASSWORD=$(cat /proc/sys/kernel/random/uuid) || return 1
  (umask 077; printf 'DB_PASS=%s\n' "$NEOM_PASSWORD" > "$NEOM_LAB_ROOT/.env") || return 1
  unset NEOM_PASSWORD
fi
NEOM_LAB_WIN=$(wslpath -w "$NEOM_LAB_ROOT") || return 1
NEOM_COMPOSE_WIN=$(wslpath -w "$NEOM_LAB_ROOT/compose.yaml") || return 1
NEOM_ENV_WIN=$(wslpath -w "$NEOM_LAB_ROOT/.env") || return 1
NEOM_API_WIN=$(wslpath -w "$NEOM_LAB_ROOT/api") || return 1

# A short name for Compose, pinned to this lab and the working Windows Docker context.
dc() {
  docker.exe --context desktop-linux compose \
    --project-name neom-platform-lab \
    --project-directory "$NEOM_LAB_WIN" \
    --env-file "$NEOM_ENV_WIN" \
    --file "$NEOM_COMPOSE_WIN" "$@"
}

# Resolve and lock dependencies using a temporary Node container, not a host installation.
lab_lock() {
  docker.exe --context desktop-linux run --rm \
    --mount "type=bind,source=$NEOM_API_WIN,target=/app" \
    --workdir /app node:24-alpine \
    npm install --package-lock-only --ignore-scripts --no-audit --no-fund
}
printf '%s\n' 'Lab commands ready: lab_lock, dc. No infrastructure changed.'
