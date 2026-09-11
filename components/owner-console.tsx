'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getAllUsers, getOwnerPayoutData, promoteUserToAdmin, reviewPayout, updateCPMRate, verifyOwnerKey } from '@/app/actions/links'
import { KeyRound, Loader2, ShieldCheck, UserPlus } from 'lucide-react'

type OwnerUser = { id: string; name: string; username: string | null; email: string; role: string; balance: string; status: string; totalClicks: number; totalRevenue: number; createdAt: Date }
type OwnerPayout = { request: { id: number; amount: string; method: string; accountDetails: string; createdAt: Date }; name: string; username: string | null; email: string }

export function OwnerConsole({ initialUsers, currentRate }: { initialUsers: OwnerUser[]; currentRate: number }) {
  const [key, setKey] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [rate, setRate] = useState(String(currentRate))
  const [pending, setPending] = useState(false)
  const [users, setUsers] = useState(initialUsers)
  const [payouts, setPayouts] = useState<OwnerPayout[]>([])

  async function unlock() {
    setPending(true); setError('')
    const result = await verifyOwnerKey(key)
    if (!result.ok) setError('That owner key was not accepted.')
    else {
      const [loadedUsers, loadedPayouts] = await Promise.all([getAllUsers(), getOwnerPayoutData()])
      setUsers(loadedUsers ?? [])
      setPayouts(loadedPayouts ?? [])
      setUnlocked(true)
    }
    setPending(false)
  }

  async function makeAdmin(id: string) {
    setPending(true)
    const result = await promoteUserToAdmin(id)
    if (result.ok) setUsers((items) => items.map((item) => item.id === id ? { ...item, role: 'admin' } : item))
    else setError(result.error ?? 'Could not update user.')
    setPending(false)
  }

  async function saveRate() {
    const result = await updateCPMRate(Number(rate))
    if (!result.ok) setError(result.error ?? 'Could not save rate.')
  }

  if (!unlocked) return <main className="flex min-h-dvh items-center justify-center px-5"><div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-2xl"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><KeyRound className="size-5" /></div><p className="mt-7 text-sm font-bold tracking-[0.2em] text-primary">OWNER CONSOLE</p><h1 className="mt-3 text-3xl font-bold">Private control room</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Enter your owner key to manage platform access and payout settings.</p><input type="password" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') unlock() }} className="mt-7 h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-primary" placeholder="Owner secret key" />{error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}<Button onClick={unlock} disabled={pending || !key} className="mt-4 h-12 w-full">{pending ? <Loader2 className="animate-spin" /> : 'Unlock console'}</Button><a href="/" className="mt-5 block text-center text-sm text-muted-foreground hover:text-foreground">Return to Sniplink</a></div></main>

  return <main className="min-h-dvh px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><header className="flex items-center justify-between"><div><p className="text-sm font-bold tracking-[0.2em] text-primary">OWNER CONSOLE</p><h1 className="mt-2 text-3xl font-bold">Control room</h1></div><a href="/" className="text-sm font-semibold text-primary">Exit</a></header><div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><section className="rounded-3xl border border-border bg-card p-6"><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-primary" /><h2 className="font-bold">Payout settings</h2></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Set the estimated payout per 1,000 verified views for all creators.</p><div className="mt-6 flex gap-3"><input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3" /><Button onClick={saveRate}>Save CPM</Button></div></section><section className="rounded-3xl border border-border bg-card p-6"><div className="flex items-center gap-3"><UserPlus className="size-5 text-primary" /><h2 className="font-bold">Manage administrators</h2></div><p className="mt-3 text-sm text-muted-foreground">Only you can grant platform admin access.</p><div className="mt-5 divide-y divide-border">{users.map((user) => <div key={user.id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="truncate font-semibold">{user.name}</p><p className="truncate text-sm text-muted-foreground">{user.email}</p></div>{user.role === 'admin' ? <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">Admin</span> : <Button size="sm" variant="outline" onClick={() => makeAdmin(user.id)} disabled={pending}>Make admin</Button>}</div>)}</div></section></div><section className="mt-8 rounded-3xl border border-border bg-card p-6"><h2 className="font-bold">User Management</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th className="p-3">Username</th><th className="p-3">Email</th><th className="p-3">Clicks</th><th className="p-3">Revenue</th><th className="p-3">Balance</th><th className="p-3">Status</th><th className="p-3">Role</th></tr></thead><tbody>{users.map((item) => <tr key={item.id} className="border-b border-border/60"><td className="p-3 font-semibold">{item.username ?? item.name}</td><td className="p-3">{item.email}</td><td className="p-3">{item.totalClicks}</td><td className="p-3">${item.totalRevenue.toFixed(2)}</td><td className="p-3">${Number(item.balance).toFixed(2)}</td><td className="p-3">{item.status}</td><td className="p-3">{item.role}</td></tr>)}</tbody></table></div></section><section className="mt-8 rounded-3xl border border-border bg-card p-6"><h2 className="font-bold">Pending Payout Requests</h2><div className="mt-4 space-y-3">{payouts.length ? payouts.map(({ request, name, username, email }) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/60 p-4"><div><p className="font-semibold">{username ?? name} · ${Number(request.amount).toFixed(2)}</p><p className="text-sm text-muted-foreground">{email} · {request.method} · {request.accountDetails}</p></div><div className="flex gap-2"><Button size="sm" onClick={async () => { const result = await reviewPayout(request.id, 'approved'); if (result.ok) setPayouts((items) => items.filter((item) => item.request.id !== request.id)) }}>Approve Payment</Button><Button size="sm" variant="outline" onClick={async () => { const result = await reviewPayout(request.id, 'rejected', 'Rejected by owner'); if (result.ok) setPayouts((items) => items.filter((item) => item.request.id !== request.id)) }}>Reject Payment</Button></div></div>) : <p className="text-sm text-muted-foreground">No pending payout requests.</p>}</div></section></div></main>
}
