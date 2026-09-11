import Link from "next/link"
import { LinkIcon } from "lucide-react"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-5 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <LinkIcon className="size-6" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Link not found</h1>
      <p className="max-w-sm text-pretty text-muted-foreground">
        This short link doesn&apos;t exist or may have expired. Try creating a new one.
      </p>
      <Link href="/" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Create a short link</Link>
    </main>
  )
}
