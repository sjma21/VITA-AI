# Vita

Your living resume. Let recruiters ask.

Personal AI resume chatbot for HRs — grounded answers from your profile, resume embeddings (Postgres + pgvector), and GitHub context.

See [docs/PLAN.md](docs/PLAN.md) for the full product plan.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL + pgvector
- Docker Compose for local Postgres (**host port 5433** — avoids clashing with local Postgres on 5432)
- Embeddings via **OpenRouter** (`nvidia/nemotron-3-embed-1b:free`, 2048 dims)
- Chat LLM (Phase 2): Anthropic Claude

## Prerequisites

- Node 20+
- [pnpm](https://pnpm.io)
- Docker Desktop running (for local Postgres)
- [OpenRouter API key](https://openrouter.ai/keys) (embeddings)
- Anthropic API key (chat — Phase 2)
- GitHub personal access token (read-only) for repo ingest

## Setup

```bash
# Install deps
pnpm install

# Copy env and fill keys
cp .env.example .env
# Required for ingest: OPENROUTER_API_KEY, GITHUB_TOKEN, GITHUB_USERNAME
# DATABASE_URL should use port 5433 (see .env.example)

# Start Postgres with pgvector
pnpm db:up

# Apply migrations (enables vector extension + tables)
pnpm db:migrate

# Generate Prisma Client
pnpm db:generate

# Ingest profile + resume/cover letter + GitHub allowlist
pnpm ingest:all

# Dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Chat (Phase 2)

```bash
pnpm db:up
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and ask recruiter questions.
Use **Match JD** to paste a job description and get a grounded fit report.
Use **Proof pack** for resume / cover letter downloads, LinkedIn, and featured GitHub repos.
Use **Book a call** so HRs can request a meeting (emails only `OWNER_EMAIL` via Resend — no HR auto-reply).
Requires `ANTHROPIC_API_KEY` + `OPENROUTER_API_KEY` in `.env` (and ingested chunks via `pnpm ingest:all`).
For meeting emails, set `RESEND_API_KEY` and `OWNER_EMAIL=sajalmishra361@gmail.com`.

| Script | Purpose |
|--------|---------|
| `pnpm ingest:profile` | Embed `content/profile.yaml` blocks |
| `pnpm ingest:resume` | Embed resume + cover letter PDFs |
| `pnpm ingest:docs` | Profile + resume |
| `pnpm ingest:github` | Embed allowlisted GitHub repos |
| `pnpm ingest:all` | Everything above |

HTTP (protected by `x-ingest-secret` = `INGEST_SECRET`):

```bash
curl -X POST 'http://localhost:3000/api/ingest?target=all' \
  -H "x-ingest-secret: $INGEST_SECRET"
```

`target` can be `all` | `profile` | `resume` | `github`.

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
content/          # profile.yaml, resume.pdf, cover-letter.pdf
docs/PLAN.md      # product plan
prisma/           # schema + migrations (incl. pgvector)
scripts/          # ingest CLI
src/app/          # Next.js App Router + /api/ingest
src/lib/          # profile, rag, ingest, db
docker-compose.yml
```

## Phases

0. Foundation — done  
1. Context pipeline — done  
2. Chat agent (RAG + streaming) — done  
3. HR UI polish — done  
4. Harden & ship  

## License

Private / personal showcase.
