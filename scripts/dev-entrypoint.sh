#!/bin/sh
set -eu
# New CLI credentials/configuration should not be world-readable.
umask 077

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${POSTGRES_HOST:=db}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_USER:=winc}"
: "${POSTGRES_DB:=winc}"
export POSTGRES_HOST POSTGRES_PORT POSTGRES_USER POSTGRES_DB

# Encode the password instead of requiring URL-safe characters. Explicitly
# override a host-only DATABASE_URL that might be present in the source .env.
DATABASE_URL=$(node --input-type=module -e '
  const e = process.env;
  const url = new URL(`postgresql://${e.POSTGRES_HOST}:${e.POSTGRES_PORT}/${e.POSTGRES_DB}`);
  url.username = encodeURIComponent(e.POSTGRES_USER);
  url.password = encodeURIComponent(e.POSTGRES_PASSWORD);
  process.stdout.write(url.href);
')
export DATABASE_URL

# A named volume hides host dependencies. Reinstall only when the manifest,
# lockfile or Node runtime changes; never leave a success marker after failure.
mkdir -p node_modules
fingerprint=$({
  cat package.json package-lock.json
  for manifest in extensions/*/package.json; do
    if [ -f "$manifest" ]; then
      printf '%s\n' "$manifest"
      cat "$manifest"
    fi
  done
  node -p 'process.version + process.platform + process.arch'
} | sha256sum | cut -d ' ' -f 1)
marker=node_modules/.compose-install-fingerprint
if [ ! -f "$marker" ] || [ "$(cat "$marker")" != "$fingerprint" ]; then
  rm -f "$marker"
  npm ci
  printf '%s\n' "$fingerprint" > "$marker"
fi

# Also wait here: compose providers differ in depends_on healthcheck support.
printf '%s\n' 'Waiting for PostgreSQL...'
attempt=0
until PGCONNECT_TIMEOUT=2 PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 -c 'SELECT 1' >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    printf '%s\n' 'PostgreSQL was not ready after 60 attempts. Check db logs and credentials.' >&2
    exit 1
  fi
  sleep 2
done

# shopify.web.toml runs prisma generate and migrate deploy before starting Vite.
exec "$@"
