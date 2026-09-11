'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { links, settings, user } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { headers } from 'next/headers'

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

function generateSlug(length = 6) {
  let slug = ''
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
    if (!url.hostname.includes('.')) return null
    return url.toString()
  } catch {
    return null
  }
}

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  return session.user.id
}

export type CreateLinkResult =
  | { ok: true; slug: string; originalUrl: string }
  | { ok: false; error: string }

export async function createLink(formData: FormData): Promise<CreateLinkResult> {
  const userId = await getUserId()
  const raw = String(formData.get('url') ?? '')
  const originalUrl = normalizeUrl(raw)

  if (!originalUrl) {
    return { ok: false, error: 'Please enter a valid URL.' }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug()
    try {
      const [row] = await db
        .insert(links)
        .values({ slug, originalUrl, userId })
        .returning({ slug: links.slug, originalUrl: links.originalUrl })
      return { ok: true, slug: row.slug, originalUrl: row.originalUrl }
    } catch {
      // collision, retry
    }
  }

  return { ok: false, error: 'Could not generate a unique link. Please try again.' }
}

export async function getLinkBySlug(slug: string) {
  const [row] = await db.select().from(links).where(eq(links.slug, slug)).limit(1)
  return row ?? null
}

export async function registerClick(slug: string) {
  await db.update(links).set({ clicks: sql`${links.clicks} + 1` }).where(eq(links.slug, slug))
}

export async function getUserLinks() {
  const userId = await getUserId()
  if (!userId) return []

  return db.select().from(links).where(eq(links.userId, userId)).orderBy(desc(links.createdAt))
}

export async function getCPMRate() {
  const [row] = await db.select().from(settings).limit(1)
  return row ? parseFloat(String(row.cpmRate)) : 5.0
}

export async function getUserEarnings() {
  const userId = await getUserId()
  if (!userId) return null

  const userLinks = await db.select().from(links).where(eq(links.userId, userId))
  const cpm = await getCPMRate()
  const totalClicks = userLinks.reduce((sum, link) => sum + link.clicks, 0)
  const earnings = (totalClicks / 1000) * cpm

  return { totalClicks, earnings, cpm, linkCount: userLinks.length }
}

// Admin and owner functions
export async function getAllUsers() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user?.role !== 'admin') {
    return null
  }

  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
}

export async function getAllLinks() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user?.role !== 'admin') {
    return null
  }

  return db.select().from(links).orderBy(desc(links.createdAt))
}

export async function promoteUserToAdmin(targetUserId: string, ownerKey: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  const isOwner = ownerKey === process.env.OWNER_SECRET_KEY
  if (!isOwner && session?.user?.role !== 'admin') {
    return { ok: false, error: 'Unauthorized' }
  }
  await db.update(user).set({ role: 'admin' }).where(eq(user.id, targetUserId))
  return { ok: true }
}

export async function updateCPMRate(newRate: number, ownerKey: string) {
  if (!ownerKey || ownerKey !== process.env.OWNER_SECRET_KEY || !Number.isFinite(newRate) || newRate < 0) {
    return { ok: false, error: 'Invalid owner key or rate' }
  }

  await db.update(settings).set({ cpmRate: String(newRate) }).where(eq(settings.id, 1))
  return { ok: true }
}

export async function verifyOwnerKey(key: string) {
  if (key === process.env.OWNER_SECRET_KEY) {
    return { ok: true }
  }
  return { ok: false, error: 'Invalid owner key' }
}
