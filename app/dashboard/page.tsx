import type React from 'react'
import { auth } from '@/lib/auth'
import { getUserEarnings, getUserLinks } from '@/app/actions/links'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ExternalLink, Eye, Link2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/logout-button'
import { ShortenerForm } from '@/components/shortener-form'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const [stats, links] = await Promise.all([getUserEarnings(), getUserLinks()])
  const initials = session.user.name.slice(0, 1).toUpperCase()

  return <main className="min-h-dvh bg-[radial-gradient(circle_at_top_right,_rgba(124,58,237,0.13),_transparent_35%)] px-5 py-6 sm:px-8 lg:px-12">
    <header className="mx-auto flex max-w-7xl items-center justify-between"><a href="/" className="flex items-center gap-2 text-sm font-bold tracking-[0.2em]"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">S</span> SNIPLINK</a><div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:block">{session.user.email}</span><span className="flex size-9 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{initials}</span><LogoutButton /></div></header>
    <section className="mx-auto mt-12 max-w-7xl"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Creator dashboard</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Good to see you, {session.user.name.split(' ')[0]}.</h1><p className="mt-2 text-muted-foreground">Turn every share into measurable momentum.</p></div><a href="#links" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">View my links</a></div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={<Eye className="size-4" />} label="Total views" value={String(stats?.totalClicks ?? 0)} /><Stat icon={<Wallet className="size-4" />} label="Estimated earnings" value={`$${(stats?.earnings ?? 0).toFixed(2)}`} /><Stat icon={<Link2 className="size-4" />} label="Active links" value={String(stats?.linkCount ?? 0)} /><Stat icon={<span className="text-xs font-bold">$</span>} label="Current CPM" value={`$${(stats?.cpm ?? 5).toFixed(2)}`} /> </div>
      <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="mb-5"><h2 className="text-xl font-bold">Create a monetized link</h2><p className="mt-1 text-sm text-muted-foreground">Your destination stays private while visitors complete the sponsor flow.</p></div><ShortenerForm /></div>
      <section id="links" className="mt-8 rounded-3xl border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border p-5 sm:p-7"><div><h2 className="text-xl font-bold">Your links</h2><p className="mt-1 text-sm text-muted-foreground">Every verified view contributes to your estimate.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{links.length} total</span></div>{links.length ? <div className="divide-y divide-border">{links.map((link) => <div key={link.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div className="min-w-0"><p className="font-semibold text-primary">/{link.slug}</p><p className="mt-1 max-w-xl truncate text-sm text-muted-foreground">Private destination</p><p className="mt-2 text-xs text-muted-foreground">Created {link.createdAt.toLocaleDateString()}</p></div><div className="flex items-center gap-3"><span className="rounded-xl bg-secondary px-3 py-2 text-sm font-semibold"><Eye className="mr-1 inline size-4 text-primary" />{link.clicks}</span><Button asChild size="sm" variant="outline"><a href={`/${link.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-3.5" /> Open</a></Button></div></div>)}</div> : <div className="p-10 text-center text-sm text-muted-foreground">Your generated links will appear here.</div>}</section>
    </section>
  </main>
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl border border-border bg-card p-5"><div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div><p className="mt-5 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight">{value}</p></div> }
