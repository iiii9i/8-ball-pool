"use server"

import { db } from "@/lib/db"
import { links } from "@/lib/db/schema"
import { desc, eq, sql } from "drizzle-orm"

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"

function generateSlug(length = 6) {
  let slug = ""
  for (let i = 0; i < length; i++) {
    slug += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return slug
}

function normalizeUrl(input: string): string | null {
  let value = input.trim()
  if (!value) return null
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`
  }
  try {
    const url = new URL(value)
    if (url.hostname.includes(".") === false) return null
    return url.toString()
  } catch {
    return null
  }
}

export type CreateLinkResult =
  | { ok: true; slug: string; originalUrl: string }
  | { ok: false; error: string }

export async function createLink(formData: FormData): Promise<CreateLinkResult> {
  const raw = String(formData.get("url") ?? "")
  const originalUrl = normalizeUrl(raw)

  if (!originalUrl) {
    return { ok: false, error: "Please enter a valid URL." }
  }

  // Try a few times in the unlikely event of a slug collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug()
    try {
      const [row] = await db
        .insert(links)
        .values({ slug, originalUrl })
        .returning({ slug: links.slug, originalUrl: links.originalUrl })
      return { ok: true, slug: row.slug, originalUrl: row.originalUrl }
    } catch {
      // collision on unique slug, retry with a new slug
    }
  }

  return { ok: false, error: "Could not generate a unique link. Please try again." }
}

export async function getLinkBySlug(slug: string) {
  const [row] = await db.select().from(links).where(eq(links.slug, slug)).limit(1)
  return row ?? null
}

export async function registerClick(slug: string) {
  await db
    .update(links)
    .set({ clicks: sql`${links.clicks} + 1` })
    .where(eq(links.slug, slug))
}

export async function getRecentLinks() {
  return db.select().from(links).orderBy(desc(links.createdAt)).limit(8)
}
