# Vita

Your living resume. Let recruiters ask.

Personal AI resume chatbot for HRs — grounded answers from your profile, resume embeddings (Postgres + pgvector), and GitHub context.

See [docs/PLAN.md](docs/PLAN.md) for the full product plan.

## Stack (Phase 0)

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL + pgvector
- Docker Compose for local Postgres

## Prerequisites

- Node 20+
- [pnpm](https://pnpm.io)
- Docker Desktop running (for local Postgres)

## Setup

```bash
# Install deps
pnpm install

# Copy env
cp .env.example .env

# Start Postgres with pgvector
pnpm db:up

# Apply migrations (enables vector extension + tables)
pnpm db:migrate

# Generate Prisma Client
pnpm db:generate

# Dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Next.js dev server |
| `pnpm build` / `pnpm start` | Production build |
| `pnpm db:up` / `pnpm db:down` | Start/stop Docker Postgres |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:studio` | Prisma Studio |

## Project layout

```
content/          # profile.yaml (+ resume.pdf later)
docs/PLAN.md      # product plan
prisma/           # schema + migrations (incl. pgvector)
src/app/          # Next.js App Router
src/lib/db.ts     # Prisma client singleton
docker-compose.yml
```

## Phases

0. Foundation (this commit)  
1. Context pipeline (profile / resume / GitHub ingest)  
2. Chat agent (RAG + streaming)  
3. HR UI  
4. Harden & ship  

## License

Private / personal showcase.
