import { notFound } from "next/navigation"
import { getLinkBySlug } from "@/app/actions/links"
import { AdInterstitial } from "@/components/ad-interstitial"

export const dynamic = "force-dynamic"

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const link = await getLinkBySlug(slug)
  if (!link) {
    notFound()
  }

  return <AdInterstitial destination={link.originalUrl} slug={slug} />
}
