"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, ShieldCheck } from "lucide-react"

const COUNTDOWN_SECONDS = 5

const ADS = [
  {
    title: "CloudDeploy Pro",
    tagline: "Ship your apps to the edge in seconds. Zero config.",
    cta: "Start free",
    color: "oklch(0.62 0.19 145)",
  },
  {
    title: "Focus — Music for Work",
    tagline: "Deep-focus playlists engineered to keep you in flow.",
    cta: "Try 30 days free",
    color: "oklch(0.6 0.21 25)",
  },
  {
    title: "InboxZero",
    tagline: "The AI email assistant that clears your inbox for you.",
    cta: "Get early access",
    color: "oklch(0.58 0.2 264)",
  },
]

export function AdInterstitial({
  destination,
  slug,
}: {
  destination: string
  slug: string
}) {
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS)
  const [ad] = useState(() => ADS[Math.floor(Math.random() * ADS.length)])

  useEffect(() => {
    if (seconds <= 0) return
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])

  useEffect(() => {
    if (seconds > 0) return
    const redirect = setTimeout(() => {
      window.location.href = destination
    }, 400)
    return () => clearTimeout(redirect)
  }, [seconds, destination])

  const ready = seconds <= 0
  const progress = ((COUNTDOWN_SECONDS - seconds) / COUNTDOWN_SECONDS) * 100

  let host = destination
  try {
    host = new URL(destination).host
  } catch {
    // keep raw string
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sniplink</p>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Safe redirect
          </span>
        </div>

        <div className="mt-6 flex flex-col items-center text-center">
          {ready ? (
            <p className="text-sm font-medium text-foreground">Redirecting you now…</p>
          ) : (
            <>
              <div className="relative flex size-16 items-center justify-center">
                <svg className="absolute inset-0 size-16 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border)" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(progress / 100) * 100.5} 100.5`}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span className="text-xl font-bold tabular-nums">{seconds}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {"You'll be redirected in a moment"}
              </p>
            </>
          )}
          <p className="mt-2 max-w-full truncate text-sm font-medium text-foreground">{host}</p>
        </div>
      </div>

      {/* Sponsored ad */}
      <section
        aria-label="Advertisement"
        className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Advertisement
          </span>
        </div>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-xl text-2xl font-black text-white"
            style={{ backgroundColor: ad.color }}
          >
            {ad.title.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold tracking-tight">{ad.title}</h2>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{ad.tagline}</p>
          </div>
          <Button variant="secondary" className="shrink-0" type="button">
            {ad.cta}
          </Button>
        </div>
      </section>

      <div className="mt-6 flex flex-col items-center gap-3">
        {ready ? (
          <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
            <a href={destination}>
              Continue to destination
              <ExternalLink className="size-4" />
            </a>
          </Button>
        ) : (
          <Button disabled size="lg" className="w-full gap-2 sm:w-auto">
            Please wait {seconds}s…
          </Button>
        )}
        <p className="text-center text-xs text-muted-foreground">
          Short link <span className="font-medium text-foreground">/{slug}</span> — Sniplink is not responsible for
          external content.
        </p>
      </div>
    </main>
  )
}
