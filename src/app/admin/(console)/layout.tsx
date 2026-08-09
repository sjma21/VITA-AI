import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin-logout-button";

export default function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col">
      <header className="border-b border-border/80 bg-card/60">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
          <div className="flex items-baseline gap-3">
            <Link
              href="/admin"
              className="font-heading text-xl text-vita-teal transition hover:opacity-80"
            >
              Vita
            </Link>
            <span className="text-sm text-muted-foreground">Admin</span>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="rounded-lg px-2.5 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Public site
            </Link>
            <AdminLogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
