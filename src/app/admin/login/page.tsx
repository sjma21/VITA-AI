"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const configError = searchParams.get("error") === "not_configured";

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    configError
      ? "Set ADMIN_PASSWORD in .env, then restart the server."
      : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (configError) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      router.replace(next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border/90 bg-card/90 px-5 py-6"
    >
      <div>
        <p className="font-heading text-2xl text-vita-teal">Vita</p>
        <h1 className="mt-1 font-heading text-xl text-foreground">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Password-gated inbox for meeting requests and chats.
        </p>
      </div>

      <label className="space-y-1.5 text-sm">
        <span className="font-medium">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy || configError}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-vita-teal/50 focus:ring-2 focus:ring-vita-teal/20"
          placeholder="ADMIN_PASSWORD"
        />
      </label>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy || configError}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>

      <a
        href="/"
        className="text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Back to Vita
      </a>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 flex-col px-5 py-16">
      <Suspense
        fallback={
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
