"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "vita-intro-seen";
const HOLD_MS = 1600;
const FADE_MS = 700;

type Phase = "checking" | "show" | "exit" | "done";

const BUBBLES = [
  { left: "8%", size: 18, delay: "0s", duration: "4.2s", opacity: 0.35 },
  { left: "18%", size: 28, delay: "0.4s", duration: "5.1s", opacity: 0.28 },
  { left: "32%", size: 14, delay: "0.15s", duration: "3.8s", opacity: 0.4 },
  { left: "45%", size: 36, delay: "0.7s", duration: "5.6s", opacity: 0.22 },
  { left: "58%", size: 20, delay: "0.25s", duration: "4.5s", opacity: 0.32 },
  { left: "70%", size: 42, delay: "0.55s", duration: "6s", opacity: 0.18 },
  { left: "82%", size: 16, delay: "0.1s", duration: "3.9s", opacity: 0.38 },
  { left: "90%", size: 24, delay: "0.85s", duration: "4.8s", opacity: 0.26 },
  { left: "12%", size: 12, delay: "1.1s", duration: "4.1s", opacity: 0.3 },
  { left: "50%", size: 22, delay: "0.35s", duration: "5.3s", opacity: 0.24 },
  { left: "66%", size: 15, delay: "0.95s", duration: "4.4s", opacity: 0.34 },
  { left: "78%", size: 30, delay: "0.2s", duration: "5.8s", opacity: 0.2 },
];

export function IntroSplash() {
  const [phase, setPhase] = useState<Phase>("checking");

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1" || reduced) {
        setPhase("done");
        return;
      }
    } catch {
      // private mode / blocked storage — still show once this mount
    }

    setPhase("show");

    const exitTimer = window.setTimeout(() => {
      setPhase("exit");
    }, HOLD_MS);

    const doneTimer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
      setPhase("done");
    }, HOLD_MS + FADE_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  useEffect(() => {
    if (phase !== "show" && phase !== "exit") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  if (phase === "checking" || phase === "done") return null;

  return (
    <div
      className={`vita-intro-overlay ${phase === "exit" ? "vita-intro-exit" : ""}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="vita-intro-bubbles" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="vita-intro-bubble"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              opacity: b.opacity,
              animationDelay: b.delay,
              animationDuration: b.duration,
            }}
          />
        ))}
      </div>

      <div className="vita-intro-mark">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Welcome to
        </p>
        <p className="mt-2 font-heading text-5xl tracking-tight text-vita-teal sm:text-6xl">
          Vita
        </p>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:max-w-md sm:text-base">
          A living chatbot with everything about Sajal Mishra — built so HRs can
          get to know him fast.
        </p>
      </div>
    </div>
  );
}
