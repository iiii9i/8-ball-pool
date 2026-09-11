'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { promoteUserToAdmin, updateCPMRate, verifyOwnerKey } from '@/app/actions/links'
import { KeyRound, Loader2, ShieldCheck, UserPlus } from 'lucide-react'

type OwnerUser = { id: string; name: string; email: string; role: string; createdAt: Date }

export function OwnerConsole({ initialUsers, currentRate }: { initialUsers: OwnerUser[]; currentRate: number }) {
  const [key, setKey] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [rate, setRate] = useState(String(currentRate))
  const [pending, setPending] = useState(false)
  const [users, setUsers] = useState(initialUsers)

  async function unlock() {
    setPending(true); setError('')
    const result = await verifyOwnerKey(key)
    if (!result.ok) setError('That owner key was not accepted.')
    else setUnlocked(true)
    setPending(false)
  }

  async function makeAdmin(id: string) {
    setPending(true)
    const result = await promoteUserToAdmin(id, key)
    if (result.ok) setUsers((items) => items.map((item) => item.id === id ? { ...item, role: 'admin' } : item))
    else setError(result.error ?? 'Could not update user.')
    setPending(false)
  }

  async function saveRate() {
    const result = await updateCPMRate(Number(rate), key)
    if (!result.ok) setError(result.error ?? 'Could not save rate.')
  }

  if (!unlocked) return <main className="flex min-h-dvh items-center justify-center px-5"><div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-2xl"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><KeyRound className="size-5" /></div><p className="mt-7 text-sm font-bold tracking-[0.2em] text-primary">OWNER CONSOLE</p><h1 className="mt-3 text-3xl font-bold">Private control room</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Enter your owner key to manage platform access and payout settings.</p><input type="password" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') unlock() }} className="mt-7 h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-primary" placeholder="Owner secret key" />{error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}<Button onClick={unlock} disabled={pending || !key} className="mt-4 h-12 w-full">{pending ? <Loader2 className="animate-spin" /> : 'Unlock console'}</Button><a href="/" className="mt-5 block text-center text-sm text-muted-foreground hover:text-foreground">Return to Sniplink</a></div></main>

  return <main className="min-h-dvh px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><header className="flex items-center justify-between"><div><p className="text-sm font-bold tracking-[0.2em] text-primary">OWNER CONSOLE</p><h1 className="mt-2 text-3xl font-bold">Control room</h1></div><a href="/" className="text-sm font-semibold text-primary">Exit</a></header><div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><section className="rounded-3xl border border-border bg-card p-6"><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-primary" /><h2 className="font-bold">Payout settings</h2></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Set the estimated payout per 1,000 verified views for all creators.</p><div className="mt-6 flex gap-3"><input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3" /><Button onClick={saveRate}>Save CPM</Button></div></section><section className="rounded-3xl border border-border bg-card p-6"><div className="flex items-center gap-3"><UserPlus className="size-5 text-primary" /><h2 className="font-bold">Manage administrators</h2></div><p className="mt-3 text-sm text-muted-foreground">Only you can grant platform admin access.</p><div className="mt-5 divide-y divide-border">{users.map((user) => <div key={user.id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="truncate font-semibold">{user.name}</p><p className="truncate text-sm text-muted-foreground">{user.email}</p></div>{user.role === 'admin' ? <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">Admin</span> : <Button size="sm" variant="outline" onClick={() => makeAdmin(user.id)} disabled={pending}>Make admin</Button>}</div>)}</div></section></div></div></main>
}
