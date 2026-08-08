import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.02_250),_transparent_55%),linear-gradient(to_bottom,_var(--background),_oklch(0.97_0.01_240))]"
      />
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-24">
        <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Vita
        </p>
        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Your living resume.
            <span className="block text-muted-foreground">
              Let recruiters ask.
            </span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Phase 0 foundation is up — Next.js, Prisma, and Postgres with
            pgvector. Chat and context ingest land in the next phases.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button disabled>Ask about my experience</Button>
          <Button variant="outline" asChild>
            <a href="https://github.com/sjma21/VITA-AI" target="_blank" rel="noreferrer">
              View repo
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}
