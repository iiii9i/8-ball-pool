'use client'

import { useTransition } from 'react'
import { reviewWithdrawal } from '@/app/actions/links'
import { Button } from '@/components/ui/button'

type Row = { request: { id: number; amount: string; paymentMethod: string; accountNumber: string; status: string; reason: string | null; createdAt: Date }; name: string; username: string | null; email: string }
export function AdminWithdrawals({ rows }: { rows: Row[] }) {
  const [pending, start] = useTransition()
  function review(id: number, decision: 'approved' | 'rejected') { const reason = decision === 'rejected' ? window.prompt('Reason for rejection?') ?? 'Rejected by admin' : ''; start(async () => { await reviewWithdrawal(id, decision, reason); window.location.reload() }) }
  return <div className="space-y-4">{rows.map(({ request, name, email }) => <article key={request.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-bold">{name}</p><p className="text-sm text-muted-foreground">{email}</p><p className="mt-3 text-sm"><span className="font-semibold">{request.paymentMethod}</span> · {request.accountNumber}</p></div><div className="text-right"><p className="text-2xl font-bold">${Number(request.amount).toFixed(2)}</p><p className="text-xs text-muted-foreground">{request.createdAt.toLocaleString()}</p></div></div><div className="mt-4 flex items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${request.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : request.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>{request.status}</span>{request.status === 'pending' ? <div className="flex gap-2"><Button size="sm" disabled={pending} onClick={() => review(request.id, 'approved')}>Approve</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => review(request.id, 'rejected')}>Reject</Button></div> : <span className="text-sm text-muted-foreground">{request.reason ?? 'Reviewed'}</span>}</div></article>)}{!rows.length ? <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No withdrawal requests yet.</p> : null}</div>
}
