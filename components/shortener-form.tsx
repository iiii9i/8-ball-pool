"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { createLink } from "@/app/actions/links"
import { Button } from "@/components/ui/button"
import { Check, Copy, Link2, Loader2 } from "lucide-react"

export function ShortenerForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setCopied(false)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createLink(formData)
      if (!result.ok) {
        setError(result.error)
        setShortUrl(null)
        return
      }
      const url = `${window.location.origin}/${result.slug}`
      setShortUrl(url)
    })
  }

  async function copyToClipboard() {
    if (!shortUrl) return
    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Could not copy to clipboard.")
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="url"
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder="Paste a long link to shorten"
            aria-label="URL to shorten"
            className="h-14 w-full rounded-xl border border-border bg-card pl-12 pr-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
        <Button type="submit" size="lg" disabled={isPending} className="h-14 px-8 text-base font-semibold">
          {isPending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Shortening
            </>
          ) : (
            "Shorten"
          )}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {shortUrl ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your short link</p>
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-lg font-semibold text-primary hover:underline"
            >
              {shortUrl}
            </a>
          </div>
          <Button onClick={copyToClipboard} variant="secondary" className="shrink-0 gap-2">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
