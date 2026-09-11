'use client'

import type React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth-client'
import { resolveLoginIdentifier } from '@/app/actions/links'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, Lock, UserRound, AtSign } from 'lucide-react'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    setPending(true); setError('')
    const identifier = String(formData.get('identifier') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const name = String(formData.get('name') ?? '').trim()
    const username = String(formData.get('username') ?? '').trim().toLowerCase()
    let result
    if (mode === 'sign-up') {
      result = await signUp.email({ email: String(formData.get('email') ?? '').trim(), password, name, username } as any)
    } else {
      const email = await resolveLoginIdentifier(identifier)
      result = email ? await signIn.email({ email, password }) : { error: { message: 'Invalid credentials' } }
    }
    if (result.error) { setError('We could not complete that request. Check your details and try again.'); setPending(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return <form action={submit} className="space-y-4">
    {mode === 'sign-up' ? <>
      <Field label="Username" name="username" icon={<AtSign className="size-4" />} placeholder="alexcreator" minLength={3} />
      <Field label="Full name" name="name" icon={<UserRound className="size-4" />} placeholder="Alex Morgan" minLength={2} />
      <Field label="Email address" name="email" type="email" icon={<Mail className="size-4" />} placeholder="you@example.com" />
    </> : <Field label="Username or email" name="identifier" icon={<UserRound className="size-4" />} placeholder="alexcreator or you@example.com" />}
    <Field label="Password" name="password" type="password" icon={<Lock className="size-4" />} placeholder="At least 8 characters" minLength={8} />
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <Button type="submit" disabled={pending} className="h-11 w-full font-semibold">{pending ? <><Loader2 className="size-4 animate-spin" /> Please wait</> : mode === 'sign-up' ? 'Create account' : 'Sign in'}</Button>
  </form>
}

function Field({ label, name, type = 'text', icon, placeholder, minLength }: { label: string; name: string; type?: string; icon: React.ReactNode; placeholder: string; minLength?: number }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span><span className="relative block">{icon}<input name={name} type={type} required minLength={minLength} className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder={placeholder} /></span></label>
}

export function AuthShell({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return <main className="flex min-h-dvh items-center justify-center px-5 py-10"><div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/10 lg:grid-cols-2"><div className="hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between"><div><div className="text-sm font-bold tracking-[0.2em]">SNIPLINK</div><p className="mt-16 max-w-xs text-4xl font-bold leading-tight">Turn attention into income.</p></div><p className="text-sm text-primary-foreground/70">Short links, smart analytics, better payouts.</p></div><div className="p-7 sm:p-10"><p className="text-sm font-bold tracking-[0.2em] text-primary">SNIPLINK</p><h1 className="mt-8 text-3xl font-bold tracking-tight">{mode === 'sign-up' ? 'Build your link income.' : 'Welcome back.'}</h1><p className="mt-2 text-muted-foreground">{mode === 'sign-up' ? 'Create an account to start earning from every valid view.' : 'Sign in with your username or email.'}</p><div className="mt-8"><AuthForm mode={mode} /></div><p className="mt-6 text-center text-sm text-muted-foreground">{mode === 'sign-up' ? 'Already have an account? ' : "Don't have an account? "}<a className="font-semibold text-primary hover:underline" href={mode === 'sign-up' ? '/sign-in' : '/sign-up'}>{mode === 'sign-up' ? 'Sign in' : 'Create one'}</a></p></div></div></main>
}

export default AuthForm

