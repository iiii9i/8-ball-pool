'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'

const STAGE_ONE_SECONDS = 60
const STAGE_TWO_SECONDS = 30

const ADS = [
  { label: 'Partner spotlight', title: 'Build your next big thing.', copy: 'Tools and ideas for people who move the internet forward.', accent: 'from-violet-600 to-indigo-500' },
  { label: 'Featured partner', title: 'Make focus your superpower.', copy: 'Discover thoughtful products made for deep work.', accent: 'from-cyan-500 to-blue-600' },
  { label: 'Sponsored story', title: 'Your best work starts here.', copy: 'A better digital toolkit for your everyday workflow.', accent: 'from-emerald-500 to-teal-600' },
]

export function AdInterstitial({ destination }: { destination: string; slug: string }) {
  const [stage, setStage] = useState<1 | 2>(1)
  const [seconds, setSeconds] = useState(STAGE_ONE_SECONDS)
  const [ad] = useState(() => ADS[Math.floor(Math.random() * ADS.length)])

  const total = stage === 1 ? STAGE_ONE_SECONDS : STAGE_TWO_SECONDS

  useEffect(() => {
    if (seconds <= 0) return
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [seconds])

  function advance() {
    if (stage === 1) {
      setStage(2)
      setSeconds(STAGE_TWO_SECONDS)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    window.location.assign(destination)
  }

  const ready = seconds === 0
  const progress = ((total - seconds) / total) * 100
  const stageLabel = stage === 1 ? 'Step 1 of 2' : 'Final step'

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_40%),linear-gradient(145deg,#090b17,#10162a)] px-4 py-8 text-white sm:px-6 sm:py-14">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center">
        <header className="mb-8 flex w-full items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold tracking-[0.22em]"><span className="flex size-8 items-center justify-center rounded-xl bg-white text-xs text-slate-950">S</span> SNIPLINK</div>
          <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/70"><ShieldCheck className="size-3.5 text-cyan-300" /> Secure passage</span>
        </header>

        <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/50"><span className="text-cyan-300">{stageLabel}</span><span>•</span><span>Preparing your destination</span></div>

        <section className="w-full rounded-[2rem] border border-white/10 bg-white/[0.08] p-7 text-center shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
          <div className="relative mx-auto flex size-32 items-center justify-center">
            <svg className="absolute inset-0 size-32 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="#67e8f9" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${(progress / 100) * 100.5} 100.5`} className="transition-all duration-1000 ease-linear" />
            </svg>
            <div><div className="text-4xl font-bold tabular-nums tracking-tight">{seconds}</div><div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/50">seconds</div></div>
          </div>
          <h1 className="mt-7 text-2xl font-bold tracking-tight sm:text-3xl">{ready ? (stage === 1 ? 'Your link is ready' : 'Almost there') : 'Please stay on this page'}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/60">{ready ? (stage === 1 ? 'Continue to the final verification step.' : 'Continue to open your destination.') : 'Your destination is being prepared securely. Keep this tab open while the sponsor message runs.'}</p>
        </section>

        <section className="mt-5 w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white text-slate-950 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400"><span>{ad.label}</span><span>Advertisement</span></div>
          <div className={`bg-gradient-to-br ${ad.accent} p-7 text-white sm:p-9`}>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold backdrop-blur">{stage === 1 ? '01' : '02'}</div>
            <h2 className="mt-8 max-w-xs text-3xl font-bold leading-tight">{ad.title}</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">{ad.copy}</p>
            <div className="mt-7 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900">Discover more <ArrowRight className="ml-2 size-3.5" /></div>
          </div>
        </section>

        <Button onClick={advance} disabled={!ready} size="lg" className="mt-6 h-14 w-full rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-200 disabled:bg-white/15 disabled:text-white/45 sm:w-auto sm:min-w-72">
          {ready ? <>{stage === 1 ? 'Continue to final step' : 'Continue to destination'} <ArrowRight className="size-4" /></> : <>Please wait {seconds}s</>}
        </Button>
        <p className="mt-5 flex items-center gap-2 text-center text-xs text-white/40"><CheckCircle2 className="size-3.5" /> Destination hidden until the final step is complete.</p>
      </div>
    </main>
  )
}
