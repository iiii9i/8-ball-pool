import Link from "next/link"
import { Button } from "@/components/ui/button"
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
      <Button asChild>
        <Link href="/">Create a short link</Link>
      </Button>
    </main>
  )
}
