'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, Lock, UserRound } from 'lucide-react'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    setPending(true)
    setError('')
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')
    const name = String(formData.get('name') ?? '')

    const result = mode === 'sign-up'
      ? await signUp.email({ email, password, name })
      : await signIn.email({ email, password })

    if (result.error) {
      setError('We could not complete that request. Check your details and try again.')
      setPending(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form action={submit} className="space-y-4">
      {mode === 'sign-up' ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium">Full name</span>
          <span className="relative block">
            <UserRound className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
            <input name="name" required minLength={2} className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Alex Morgan" />
          </span>
        </label>
      ) : null}
      <label className="block space-y-2">
        <span className="text-sm font-medium">Email address</span>
        <span className="relative block">
          <Mail className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <input name="email" type="email" required className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="you@example.com" />
        </span>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Password</span>
        <span className="relative block">
          <Lock className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <input name="password" type="password" required minLength={8} className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="At least 8 characters" />
        </span>
      </label>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} className="h-11 w-full font-semibold">
        {pending ? <><Loader2 className="size-4 animate-spin" /> Please wait</> : mode === 'sign-up' ? 'Create account' : 'Sign in'}
      </Button>
    </form>
  )
}

export function AuthShell({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/10 lg:grid-cols-2">
        <div className="hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div><div className="text-sm font-bold tracking-[0.2em]">SNIPLINK</div><p className="mt-16 max-w-xs text-4xl font-bold leading-tight">Turn attention into income.</p></div>
          <p className="text-sm text-primary-foreground/70">Short links, smart analytics, better payouts.</p>
        </div>
        <div className="p-7 sm:p-10">
          <p className="text-sm font-bold tracking-[0.2em] text-primary">SNIPLINK</p>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">{mode === 'sign-up' ? 'Build your link income.' : 'Welcome back.'}</h1>
          <p className="mt-2 text-muted-foreground">{mode === 'sign-up' ? 'Create an account to start earning from every valid view.' : 'Sign in to manage your links and earnings.'}</p>
          <div className="mt-8"><AuthForm mode={mode} /></div>
          <p className="mt-6 text-center text-sm text-muted-foreground">{mode === 'sign-up' ? 'Already have an account? ' : "Don't have an account? "}<a className="font-semibold text-primary hover:underline" href={mode === 'sign-up' ? '/sign-in' : '/sign-up'}>{mode === 'sign-up' ? 'Sign in' : 'Create one'}</a></p>
        </div>
      </div>
    </main>
  )
}

export default AuthForm
    
