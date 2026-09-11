import { ShortenerForm } from "@/components/shortener-form"
import { getRecentLinks } from "@/app/actions/links"
import { Link2, MousePointerClick, Zap } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const recent = await getRecentLinks()

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 py-10 sm:py-16">
      <header className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Link2 className="size-5" />
        </div>
        <span className="text-lg font-bold tracking-tight">Sniplink</span>
      </header>

      <section className="mt-16 sm:mt-24">
        <h1 className="text-pretty text-4xl font-bold tracking-tight sm:text-5xl">
          Shorten links. <span className="text-primary">Earn on every click.</span>
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Turn any long URL into a short, shareable link. Visitors see a quick sponsored page before being sent to the
          destination.
        </p>

        <div className="mt-8">
          <ShortenerForm />
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            Instant short links
          </li>
          <li className="flex items-center gap-2">
            <MousePointerClick className="size-4 text-primary" />
            Sponsored interstitial
          </li>
          <li className="flex items-center gap-2">
            <Link2 className="size-4 text-primary" />
            Click tracking
          </li>
        </ul>
      </section>

      {recent.length > 0 ? (
        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recently shortened</h2>
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
            {recent.map((link) => (
              <li key={link.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-primary">/{link.slug}</p>
                  <p className="truncate text-sm text-muted-foreground">{link.originalUrl}</p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-auto pt-16 text-sm text-muted-foreground">
        Built with Sniplink — a demo URL shortener.
      </footer>
    </main>
  )
}
