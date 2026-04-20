# FlowPilot Deployment Guide — Synology NAS (Docker)

## Prerequisites

- Synology NAS with Docker / Container Manager installed
- Git access to clone the repository
- SSH access to the NAS (recommended)

## Quick Start

```bash
ssh admin@your-nas-ip
git clone https://github.com/powizak/FlowPilot.git
cd FlowPilot
cp .env.example .env   # edit with your values
docker compose up -d
```

The app will be available at `http://your-nas-ip:3000`.

## Port Mappings

| Service               | Internal Port | External Port | Purpose          |
| --------------------- | ------------- | ------------- | ---------------- |
| Caddy (reverse proxy) | 3000          | **3000**      | Main entry point |
| MailHog SMTP          | 1025          | 1025          | Dev email relay  |
| MailHog UI            | 8025          | 8025          | Email viewer     |

Only Caddy's port 3000 needs to be exposed. All other services communicate internally via Docker networking.

## Environment Variables

Create a `.env` file in the project root:

```env
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

## Volumes

Docker Compose creates named volumes for data persistence:

| Volume      | Service  | Path in Container          |
| ----------- | -------- | -------------------------- |
| `pgdata`    | postgres | `/var/lib/postgresql/data` |
| `redisdata` | redis    | `/data`                    |
| `miniodata` | minio    | `/data`                    |

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
docker compose build
docker compose up -d
```

Postgres data persists in the `pgdata` volume. Run migrations if needed:

```bash
docker compose exec app npx prisma migrate deploy
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
