import { ChatPanel } from "@/components/chat-panel";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.02_250),_transparent_55%),linear-gradient(to_bottom,_var(--background),_oklch(0.97_0.01_240))]"
      />
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12 sm:py-16">
        <header className="flex flex-col gap-4">
          <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Vita
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Sajal Mishra
            <span className="mt-2 block text-xl font-normal text-muted-foreground sm:text-2xl">
              Your living resume. Let recruiters ask.
            </span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            Ask about tech stack, Syvora experience, AI projects, education, or
            GitHub work — answers are grounded in profile, resume, and repos.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <a
                href="https://www.linkedin.com/in/sajal-mishra20/"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href="https://github.com/sjma21"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/resume" target="_blank" rel="noreferrer">
                Resume PDF
              </a>
            </Button>
          </div>
        </header>

        <ChatPanel />
      </main>
    </div>
  );
}
