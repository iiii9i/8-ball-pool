'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { requestWithdrawal, savePayoutMethod } from '@/app/actions/links'

const methods = ['JazzCash', 'EasyPaisa', 'Bank Transfer', 'USDT']
type Request = { id: number; amount: string; paymentMethod: string; accountNumber: string; status: string; createdAt: Date; reason: string | null }

export function PayoutPanel({ initial }: { initial: { balance: number; methods: { method: string; accountDetails: string }[]; requests: Request[] } }) {
  const [method, setMethod] = useState(methods[0])
  const [details, setDetails] = useState(initial.methods.find((item) => item.method === methods[0])?.accountDetails ?? '')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [pending, start] = useTransition()
  function submitMethod() { start(async () => { const result = await savePayoutMethod(method, details); setMessage(result.ok ? 'Payout method saved.' : result.error ?? 'Could not save method.') }) }
  function submitWithdrawal() { start(async () => { const result = await requestWithdrawal(Number(amount), method, details); setMessage(result.ok ? 'Withdrawal request submitted.' : result.error ?? 'Could not submit request.') }) }
  return <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
    <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Withdrawals</p><h2 className="mt-2 text-2xl font-bold">Get paid</h2></div><div className="text-right"><p className="text-xs text-muted-foreground">Available balance</p><p className="text-2xl font-bold text-emerald-600">${initial.balance.toFixed(2)}</p></div></div>
    <div className="mt-6 grid gap-4 md:grid-cols-3"><select aria-label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)} className="h-11 rounded-xl border border-border bg-background px-3">{methods.map((item) => <option key={item}>{item}</option>)}</select><input aria-label="Account number" value={details} onChange={(e) => setDetails(e.target.value)} className="h-11 rounded-xl border border-border bg-background px-3" placeholder="Account number / wallet" /><input aria-label="Withdrawal amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="5" step="0.01" className="h-11 rounded-xl border border-border bg-background px-3" placeholder="Amount, minimum $5" /></div>
    <div className="mt-4 flex flex-wrap gap-3"><Button onClick={submitMethod} disabled={pending || !details}>Save payout details</Button><Button onClick={submitWithdrawal} disabled={pending || Number(amount) < 5 || !details} variant="outline">Request withdrawal</Button></div>
    {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    <div className="mt-8 border-t border-border pt-6"><h3 className="font-semibold">Payout history</h3><div className="mt-3 space-y-2">{initial.requests.length ? initial.requests.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-4 py-3 text-sm"><span>${Number(item.amount).toFixed(2)} · {item.paymentMethod}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : item.status === 'rejected' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>{item.status === 'approved' ? 'Completed' : item.status === 'rejected' ? 'Rejected' : 'Pending'}</span></div>) : <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>}</div></div>
  </section>
}
