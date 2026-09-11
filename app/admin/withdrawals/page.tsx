import { auth } from '@/lib/auth'
import { getAdminWithdrawals } from '@/app/actions/links'
import { AdminWithdrawals } from '@/components/admin-withdrawals'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminWithdrawalsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  if (session.user.role !== 'admin') redirect('/dashboard')
  const rows = await getAdminWithdrawals()
  return <main className="min-h-dvh px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-5xl"><header className="flex items-center justify-between"><a href="/admin" className="text-sm font-bold tracking-[0.2em]">SNIPLINK / ADMIN</a><a href="/dashboard" className="text-sm font-semibold text-primary">Back to dashboard</a></header><div className="mt-12"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Payout operations</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Withdrawal requests</h1><p className="mt-2 text-muted-foreground">Review real publisher requests and update their status.</p><div className="mt-8"><AdminWithdrawals rows={rows ?? []} /></div></div></div></main>
}
