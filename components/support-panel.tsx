'use client'

import { useState, useTransition } from 'react'
import { createSupportTicket, replyToSupportTicket } from '@/app/actions/links'
import { Button } from '@/components/ui/button'

export function SupportPanel({ tickets }: { tickets: { id: number; subject: string; status: string; updatedAt: Date }[] }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, start] = useTransition()
  function submit() { start(async () => { const result = await createSupportTicket(subject, message); setNotice(result.ok ? 'Ticket submitted. We will reply here.' : result.error ?? 'Could not submit ticket.'); if (result.ok) { setSubject(''); setMessage('') } }) }
  return <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Help & Support</p><h2 className="mt-2 text-2xl font-bold">We are here to help</h2><p className="mt-1 text-sm text-muted-foreground">Ask a question and follow the conversation from your dashboard.</p></div><div className="mt-6 grid gap-3"><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="h-11 rounded-xl border border-border bg-background px-3" /><textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" rows={4} className="rounded-xl border border-border bg-background p-3" /><Button onClick={submit} disabled={pending || subject.trim().length < 3 || message.trim().length < 3}>Submit ticket</Button></div>{notice ? <p className="mt-3 text-sm text-muted-foreground">{notice}</p> : null}<div className="mt-8 border-t border-border pt-6"><h3 className="font-semibold">Support history</h3><div className="mt-3 space-y-2">{tickets.length ? tickets.map((ticket) => <div key={ticket.id} className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3 text-sm"><span>{ticket.subject}</span><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold capitalize text-primary">{ticket.status}</span></div>) : <p className="text-sm text-muted-foreground">No support tickets yet.</p>}</div></div></section>
}

