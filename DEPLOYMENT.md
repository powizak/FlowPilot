# FlowPilot Deployment Guide — Synology NAS (Docker)

## Prerequisites

- Synology NAS with Docker / Container Manager installed
- Git access to clone the repository
- SSH access to the NAS (recommended)

## Quick Start

```bash
ssh admin@your-nas-ip
git clone https://github.com/powizak/FlowPilot.git /volume2/docker/FlowPilot
cd /volume2/docker/FlowPilot
cp .env.example .env   # edit with your values

# Synology DSM does NOT auto-create bind-mount host paths. Create them first:
mkdir -p ./data/postgres ./data/redis ./data/minio
cp Caddyfile ./Caddyfile 2>/dev/null || true   # already in repo; ensures it's at the expected path

docker compose -f docker-compose.yaml up -d --build
```

The app will be available at `http://your-nas-ip:3000` (or the port you set as `APP_EXTERNAL_PORT` in `.env`).

## Port Mappings

| Service               | Internal Port | External Port           | Configurable via   |
| --------------------- | ------------- | ----------------------- | ------------------ |
| Caddy (reverse proxy) | 3000          | **`APP_EXTERNAL_PORT`** | `.env` (def. 3000) |
| MailHog SMTP          | 1025          | `MAILHOG_SMTP_PORT`     | `.env` (def. 1025) |
| MailHog UI            | 8025          | `MAILHOG_UI_PORT`       | `.env` (def. 8025) |

Only these three ports are exposed to the host. Postgres, Redis, and MinIO
run **internally inside the Docker network** and are never exposed to the
host — so they **will not conflict** with any Postgres / Redis / MinIO
you already have running on your Synology. FlowPilot uses its own
isolated database stored in the `pgdata` Docker volume.

### Changing ports when you have conflicts

If port 3000 (or 1025 / 8025) is already used on your NAS, edit `.env`:

```env
APP_EXTERNAL_PORT=8080      # access FlowPilot at http://NAS:8080
MAILHOG_SMTP_PORT=11025
MAILHOG_UI_PORT=18025
```

Then recreate the containers:

```bash
docker compose -f docker-compose.yaml down
docker compose -f docker-compose.yaml up -d --build
```

## Environment Variables

Create a `.env` file in the project root:

```env
SYNOLOGY_DATA_ROOT=/volume2/docker/FlowPilot
DATABASE_URL=postgresql://flowpilot:CHANGE_ME@postgres:5432/flowpilot?schema=public
REDIS_URL=redis://redis:6379
PORT=3001
JWT_SECRET=CHANGE_ME_TO_RANDOM_64_CHARS
SMTP_HOST=mailhog
SMTP_PORT=1025
MINIO_ROOT_USER=flowpilot
MINIO_ROOT_PASSWORD=CHANGE_ME
MINIO_ENDPOINT=http://minio:9000
OPENAI_API_KEY=sk-...
```

For production, replace all `CHANGE_ME` values with strong random strings.

`docker-compose.yaml` is the Synology-oriented stack file. It expects the repo
and persistent data to live under `SYNOLOGY_DATA_ROOT`. If your NAS uses a
different volume or folder, change that variable in `.env` before starting.

## Persistent Data Paths

The Synology stack uses bind mounts under `SYNOLOGY_DATA_ROOT`. **These
directories must exist on the host before `docker compose up` — DSM does
not auto-create them and the containers will fail with
`Bind mount failed: ... does not exist`.**

```bash
mkdir -p "${SYNOLOGY_DATA_ROOT:-/volume2/docker/FlowPilot}"/data/{postgres,redis,minio}
```

| Host Path                             | Service  | Path in Container          |
| ------------------------------------- | -------- | -------------------------- |
| `${SYNOLOGY_DATA_ROOT}/data/postgres` | postgres | `/var/lib/postgresql/data` |
| `${SYNOLOGY_DATA_ROOT}/data/redis`    | redis    | `/data`                    |
| `${SYNOLOGY_DATA_ROOT}/data/minio`    | minio    | `/data`                    |
| `${SYNOLOGY_DATA_ROOT}/Caddyfile`     | caddy    | `/etc/caddy/Caddyfile`     |

The `Caddyfile` ships in the repo root; when you `git clone` into
`SYNOLOGY_DATA_ROOT` it is already at the expected path.

These persist across container restarts and upgrades.

## Resource Limits

| Service        | Memory Limit |
| -------------- | ------------ |
| app (API)      | 512 MB       |
| web (frontend) | 256 MB       |
| postgres       | 256 MB       |
| redis          | 64 MB        |
| minio          | 128 MB       |
| caddy          | 32 MB        |

Total: ~1.25 GB. A Synology NAS with 2+ GB RAM is sufficient.

## Updating

```bash
cd FlowPilot
git pull origin main
docker compose -f docker-compose.yaml up -d --build
```

Postgres data persists under `${SYNOLOGY_DATA_ROOT}/data/postgres`. Run migrations if needed:

```bash
docker compose -f docker-compose.yaml exec app npx prisma migrate deploy --schema=/app/prisma/schema.prisma
```

## Backups

```bash
docker compose exec postgres pg_dump -U flowpilot flowpilot > backup_$(date +%Y%m%d).sql
```

To restore:

```bash
docker compose exec -T postgres psql -U flowpilot flowpilot < backup_20260420.sql
```

## Troubleshooting

Check service health:

```bash
docker compose ps
docker compose logs app --tail=50
docker compose logs postgres --tail=50
```

Restart a single service:

```bash
docker compose restart app
```

Full reset (preserves data volumes):

```bash
docker compose down
docker compose up -d
```

Full reset including data:

```bash
docker compose down -v
docker compose up -d
```

### Failed Prisma migration (error `P3009`)

If the `app` container keeps crashing with:

```
Error: P3009
migrate found failed migrations in the target database...
The `YYYYMMDDHHMMSS_<name>` migration started at ... failed
```

a previous container crashed mid-migration and left the `_prisma_migrations`
table in a "failed" state. Prisma refuses to apply new migrations until
resolved.

**Recommended fix (fresh deployment, no important data yet):**

```bash
docker compose -f docker-compose.yaml down
sudo rm -rf ./data/postgres/*
docker compose -f docker-compose.yaml up -d --build
```

**Alternative (preserve data)** — mark the failed migration as rolled back:

```bash
docker compose -f docker-compose.yaml run --rm --entrypoint sh app -c \
  "./node_modules/.bin/prisma migrate resolve --rolled-back <MIGRATION_NAME> --schema=prisma/schema.prisma"
docker compose -f docker-compose.yaml up -d
```

Replace `<MIGRATION_NAME>` with the exact name from the error log (e.g.
`20260420061132_add_notifications`).
