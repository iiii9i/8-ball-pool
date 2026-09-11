import type React from 'react'
import { auth } from '@/lib/auth'
import { getAllLinks, getAllUsers, getCPMRate } from '@/app/actions/links'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Eye, ShieldCheck, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  if (session.user.role !== 'admin') redirect('/dashboard')
  const [users, links, cpm] = await Promise.all([getAllUsers(), getAllLinks(), getCPMRate()])
  const totalViews = links?.reduce((sum, link) => sum + link.clicks, 0) ?? 0
  return <main className="min-h-dvh px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><header className="flex items-center justify-between"><a href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SNIPLINK / ADMIN</a><a href="/dashboard" className="text-sm font-semibold text-primary">Back to dashboard</a></header><div className="mt-12"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Operations</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Platform overview</h1><div className="mt-8 grid gap-4 sm:grid-cols-3"><Stat icon={<Users className="size-4" />} label="Registered users" value={String(users?.length ?? 0)} /><Stat icon={<Eye className="size-4" />} label="All views" value={String(totalViews)} /><Stat icon={<ShieldCheck className="size-4" />} label="Current CPM" value={`$${cpm.toFixed(2)}`} /></div><section className="mt-8 grid gap-8 lg:grid-cols-2"><Panel title="Users"><div className="divide-y divide-border">{users?.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="truncate font-semibold">{item.name}</p><p className="truncate text-sm text-muted-foreground">{item.email}</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{item.role}</span></div>)}</div></Panel><Panel title="Latest links"><div className="divide-y divide-border">{links?.slice(0, 10).map((link) => <div key={link.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="font-semibold text-primary">/{link.slug}</p><p className="truncate text-sm text-muted-foreground">{link.originalUrl}</p></div><span className="shrink-0 text-sm font-semibold">{link.clicks} views</span></div>)}</div></Panel></section></div></div></main>
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl border border-border bg-card p-5"><div className="text-primary">{icon}</div><p className="mt-5 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div> }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><h2 className="text-lg font-bold">{title}</h2><div className="mt-3">{children}</div></div> }
