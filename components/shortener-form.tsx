'use client'

import type React from 'react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createLink } from '@/app/actions/links'
import { Button } from '@/components/ui/button'
import { Check, Copy, Link2, Loader2, Sparkles } from 'lucide-react'

export function ShortenerForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null); setCopied(false)
    startTransition(async () => {
      const result = await createLink(new FormData(e.currentTarget))
      if (!result.ok) { setError(result.error); setShortUrl(null); return }
      setShortUrl(result.shortUrl ?? `${window.location.origin}/${result.slug}`)
      router.refresh()
    })
  }

  async function copyToClipboard() {
    if (!shortUrl) return
    try { await navigator.clipboard.writeText(shortUrl); setCopied(true); window.setTimeout(() => setCopied(false), 2000) } catch { setError('Could not copy to clipboard.') }
  }

  return <div className="w-full"><form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Link2 className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><input name="url" type="text" inputMode="url" autoComplete="off" required placeholder="Paste your long URL here" aria-label="URL to shorten" className="h-14 w-full rounded-2xl border border-border bg-background pl-12 pr-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" /></div><Button type="submit" size="lg" disabled={isPending} className="h-14 rounded-2xl px-7 text-base font-semibold">{isPending ? <><Loader2 className="size-5 animate-spin" /> Shortening</> : <><Sparkles className="size-4" /> Shorten link</>}</Button></form>{error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}{shortUrl ? <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Your monetized link</p><p className="mt-1 truncate font-semibold">{shortUrl}</p></div><Button onClick={copyToClipboard} variant="secondary" className="shrink-0 gap-2">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? 'Copied' : 'Copy link'}</Button></div> : null}</div>
}
