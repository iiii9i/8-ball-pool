import { getCPMRate } from '@/app/actions/links'

export const dynamic = 'force-dynamic'

export default async function PayoutRatesPage() {
  const rate = await getCPMRate()
  return <main className="min-h-dvh bg-background px-5 py-12 sm:px-8"><div className="mx-auto max-w-4xl"><a href="/" className="text-sm font-bold tracking-[0.2em] text-primary">SNIPLINK</a><div className="mt-14 max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Payout rates</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Clear rates for every verified view.</h1><p className="mt-4 text-lg leading-8 text-muted-foreground">Published rates are applied automatically to eligible completed views and reflected in your dashboard.</p></div><div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-sm"><div className="grid grid-cols-2 border-b border-border px-6 py-4 text-sm font-semibold text-muted-foreground"><span>Country</span><span className="text-right">Publisher CPM</span></div><div className="grid grid-cols-2 px-6 py-5 text-lg font-semibold"><span>All eligible regions</span><span className="text-right text-primary">${rate.toFixed(2)}</span></div></div></div></main>
}
