# Development with Podman Compose

This starts **Shopify CLI (`npm run dev` → `shopify app dev`)**, its dev
server/tunnel, and PostgreSQL 16. There is no Redis dependency in the app, so no
Redis service is started. This is a development setup, not a production deployment;
the existing production `Dockerfile` is separate.

## First run

Install Podman and a Compose provider (for example `podman-compose`).
`podman compose` delegates to that provider. On macOS/Windows, start your Podman
machine first. Use **rootless Podman**, without `sudo`, from this repository.

1. Create a local `.env` if you do not already have one:

   ```sh
   test -f .env || cp .env.example .env
   ```

2. Set `POSTGRES_PASSWORD` in `.env` to a unique generated password, for example
   the output of `openssl rand -hex 32`. Replace the empty entry rather than
   adding duplicate entries. Keep `.env` private (`chmod 600 .env`); it is ignored
   by Git and excluded from image builds. Do not change this password later
   without also changing the existing database role password.

   Compose sets the database hostname to `db`, database/user to `winc`, and the
   entrypoint constructs `DATABASE_URL`. A localhost `DATABASE_URL` in your source
   `.env` does not override this. Shopify CLI supplies the Shopify app environment
   when it starts the web process; no API secret is baked into the image.

3. Build, start PostgreSQL, and run the app interactively:

   ```sh
   podman compose build app
   podman compose up -d db
   podman compose run --rm app
   ```

   The first run installs dependencies and prompts for Shopify login and app/store
   selection. Copy the CLI's login URL into your **host browser** and complete the
   displayed verification-code flow. A browser cannot open inside this container.
   Select the intended development app/store; do not use a production store.
   Open the HTTPS app preview link printed by CLI manually as well. CLI may update
   your development app's configuration and create a dev preview, just as it does
   outside containers.

   Use this `run --rm app` command for the normal interactive CLI experience. It
   provides a terminal for prompts/key commands, while retaining named volumes
   after the temporary container exits. Do not run multiple app containers at once.

## Subsequent runs and stopping

```sh
podman compose up -d db
podman compose run --rm app
```

After first-time login/configuration, non-interactive foreground startup is also
available with `podman compose up app`. Compose `up` does not reliably forward
interactive input across providers: if CLI needs a prompt, stop it and use `run`
above instead. For detached operation after setup, use `podman compose up -d` and
`podman compose logs -f app`.

Press Ctrl-C to stop an interactive run. `podman compose down` stops/removes the
services and network **without deleting named volumes**. Do **not** use
`podman compose down -v` or prune these volumes unless you intend to erase database
records, Shopify sessions/login, and cached configuration.

## What is retained

| Volume | Container path | Purpose |
| --- | --- | --- |
| `postgres_data` | `/var/lib/postgresql/data` | App records and Prisma Shopify sessions |
| `shopify_config` | `/root/.config` | CLI login/session tokens and cached app selection |
| `shopify_project` | `/app/.shopify` | Project-specific CLI state |
| `node_modules` | `/app/node_modules` | Linux dependencies, separate from host packages |
| `npm_cache` | `/root/.npm` | Download cache |

CLI **5.0.0** is pinned in `Containerfile.dev`. Its Linux implementation uses
`XDG_CONFIG_HOME`, with `shopify-cli-kit-nodejs/config.json` for its session store
and `shopify-cli-app-nodejs/config.json` for app selection/cache. This setup explicitly
sets `XDG_CONFIG_HOME=/root/.config` and persists the whole directory, not a guessed
`~/.shopify` auth directory. Protect this volume as credentials; do not commit or
share its contents. Containers do not automatically inherit a host CLI login.

Restart/rebuild does not force fresh authentication. Expired or revoked credentials,
logout, account changes, Shopify security policies, or deleting these volumes can
still require another login. Existing browser/admin sessions are separate.

Compose prefixes volume names with the project name (normally this directory's
name). Keep the directory/project name stable to reuse the same data. If using
`podman compose -p NAME`, use that same name on every command.

## Runtime details and maintenance

- Source is bind-mounted for live edits; the dev image copies only its entrypoint,
  never `.git`, `.env`, source credentials, or host dependencies. Both build ignore
  files exclude sensitive/generated files. The source bind mount is available to
  the running CLI, so only run trusted dependencies and development code.
- The container uses its default root user **inside rootless Podman's user
  namespace**, mapping to your host user for editable source. Do not run this setup
  with rootful Podman. `:z` labels the source bind mount for SELinux; use a dedicated
  checkout, not your home directory. Named volumes require no host `chown` or
  privileged container. Remote Podman machines must have the checkout shared.
- No host ports are published, including PostgreSQL. Shopify CLI's tunnel and web
  server run in the same container; use the tunnel HTTPS URL, not localhost.
  The default Cloudflare tunnel needs outbound network access. `--use-localhost`
  is not configured here and would require a separate networking setup.
- PostgreSQL has a healthcheck; the entrypoint also waits for an authenticated query
  (60 attempts, with a 2-second connection timeout and 2-second retry delay) for provider compatibility. The existing `shopify.web.toml`
  generates Prisma Client and applies committed migrations before Vite starts.
- Dependencies are installed with `npm ci` on first run or when `package.json`,
  `package-lock.json`, extension workspace manifests, or the Node runtime changes. Stop/restart the app after
  dependency updates. Do not run host `npm install` against the container volume.
- Create schema migrations deliberately (do not substitute `db push` for committed
  migrations): while no app instance is running, use
  `podman compose run --rm app npx prisma migrate dev --name DESCRIPTION`.
- After editing `Containerfile.dev`, run `podman compose build app` again. Take a
  database backup before any PostgreSQL major-version change; changing image tags
  is not a database upgrade procedure.
- For a database dump: `podman compose exec -T db pg_dump -U winc -d winc > backup.sql`.
  Treat backups as sensitive and store them outside the repository.

References: [Podman Compose provider behavior](https://docs.podman.io/en/latest/markdown/podman-compose.1.html),
[Shopify app dev](https://shopify.dev/docs/api/shopify-cli/app/app-dev).

## Verification status (2026-10-31)

The repository's 13 tests (including entrypoint dependency-cache, credential
encoding, install-failure, and database-retry tests), typecheck, lint, production
build, shell syntax, and YAML parsing passed. The CLI config paths above were
verified against the installed CLI 5.0.0 implementation using an isolated temporary
configuration directory, not an existing login.

Live image builds, container/database startup, and volume persistence across
container recreation **have not been verified** in the current executor. Installing
Podman was blocked by executor filesystem permissions; the authorized elevated
attempt failed before execution. A temporary `podman-compose` 1.6.0 provider was
installed, but its `config` command also requires the absent Podman executable.
No sandbox workaround was applied. Shopify sign-in and authenticated tunnel testing
were explicitly excluded by the user and were not attempted.
