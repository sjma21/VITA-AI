import { Workspace } from "@/components/workspace";
import { loadProfile } from "@/lib/profile";
import { buildProofPack } from "@/lib/proof-pack";

export default function Home() {
  const profile = loadProfile();
  const { identity } = profile;
  const proofPack = buildProofPack(profile);

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-10 pt-10 sm:px-6 sm:pt-14">
        <header className="vita-animate-fade-up mb-8 flex flex-col gap-5">
          <p className="font-heading text-3xl tracking-tight text-vita-teal sm:text-4xl">
            Vita
          </p>

          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-4xl leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              {identity.name}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
              {identity.title}
            </p>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              Ask about experience, match a JD, get a tailored pitch, review
              the proof pack, or book a call — grounded in profile, resume, and
              GitHub.
            </p>
          </div>

          <nav
            aria-label="Profile links"
            className="vita-animate-fade-up vita-delay-1 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
          >
            <a
              className="font-medium text-vita-teal underline-offset-4 transition hover:underline"
              href={identity.links.linkedin}
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
            <a
              className="font-medium text-vita-teal underline-offset-4 transition hover:underline"
              href={identity.links.github}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            {identity.links.portfolio ? (
              <a
                className="font-medium text-vita-teal underline-offset-4 transition hover:underline"
                href={identity.links.portfolio}
                target="_blank"
                rel="noreferrer"
              >
                Portfolio
              </a>
            ) : null}
            <a
              className="font-medium text-vita-teal underline-offset-4 transition hover:underline"
              href="/api/resume"
              target="_blank"
              rel="noreferrer"
            >
              Resume PDF
            </a>
            <a
              className="font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
              href={`mailto:${identity.email}`}
            >
              Email
            </a>
            <a
              className="font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
              href="/admin"
            >
              Admin
            </a>
          </nav>
        </header>

        <div className="vita-animate-fade-up vita-delay-2 flex min-h-0 flex-1 flex-col">
          <Workspace candidateName={identity.name} proofPack={proofPack} />
        </div>
      </main>
    </div>
  );
}
