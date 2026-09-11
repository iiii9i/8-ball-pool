'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { links, settings, user, payoutMethods, payoutRequests } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { headers, cookies } from 'next/headers'
import { createHash } from 'node:crypto'

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

export async function resolveLoginIdentifier(identifier: string) {
  const value = identifier.trim().toLowerCase()
  const [record] = await db.select({ email: user.email }).from(user).where(sql`lower(${user.email}) = ${value} OR lower(${user.username}) = ${value}`).limit(1)
  return record?.email ?? null
}

function generateSlug(length = 6) {
  let slug = ''
  for (let i = 0; i < length; i++) {
    slug += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return slug
}

async function getAppOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (configuredOrigin) return configuredOrigin

  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  if (!host) return null
  const protocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? 'https'
  return `${protocol}://${host}`
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
  | { ok: true; slug: string; originalUrl: string; shortUrl: string | null }
  | { ok: false; error: string }

export async function createLink(formData: FormData): Promise<CreateLinkResult> {
  const userId = await getUserId()
  if (!userId) return { ok: false, error: 'Please sign in before creating a short link.' }

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
      const origin = await getAppOrigin()
      return { ok: true, slug: row.slug, originalUrl: row.originalUrl, shortUrl: origin ? `${origin}/${row.slug}` : null }
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
  if (!(await isOwner()) && session?.user?.role !== 'admin') return null
  const users = await db.select({ id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, balance: user.balance, status: user.status, createdAt: user.createdAt }).from(user).orderBy(desc(user.createdAt))
  const allLinks = await db.select({ userId: links.userId, clicks: links.clicks }).from(links)
  const cpm = await getCPMRate()
  return users.map((item) => { const totalClicks = allLinks.filter((link) => link.userId === item.id).reduce((sum, link) => sum + link.clicks, 0); return { ...item, totalClicks, totalRevenue: (totalClicks / 1000) * cpm } })
}

export async function getAllLinks() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user?.role !== 'admin') {
    return null
  }

  return db.select().from(links).orderBy(desc(links.createdAt))
}

export async function promoteUserToAdmin(targetUserId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!(await isOwner()) && session?.user?.role !== 'admin') {
    return { ok: false, error: 'Unauthorized' }
  }
  await db.update(user).set({ role: 'admin' }).where(eq(user.id, targetUserId))
  return { ok: true }
}

export async function updateCPMRate(newRate: number) {
  if (!(await isOwner()) || !Number.isFinite(newRate) || newRate < 0) {
    return { ok: false, error: 'Invalid owner key or rate' }
  }

  await db.update(settings).set({ cpmRate: String(newRate) }).where(eq(settings.id, 1))
  return { ok: true }
}

function ownerToken() {
  return createHash('sha256').update(process.env.OWNER_SECRET_KEY ?? '').digest('hex')
}

async function isOwner() {
  return (await cookies()).get('sniplink_owner')?.value === ownerToken()
}

export async function verifyOwnerKey(key: string) {
  if (!key || key !== process.env.OWNER_SECRET_KEY) return { ok: false, error: 'Invalid owner key' }
  ;(await cookies()).set('sniplink_owner', ownerToken(), { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 60 * 60 * 8 })
  return { ok: true }
}

const validMethods = ['JazzCash', 'EasyPaisa', 'Bank Transfer', 'USDT'] as const

export async function savePayoutMethod(method: string, accountDetails: string) {
  const userId = await getUserId()
  if (!userId || !validMethods.includes(method as typeof validMethods[number]) || accountDetails.trim().length < 4) return { ok: false, error: 'Invalid payout details.' }
  await db.insert(payoutMethods).values({ userId, method, accountDetails: accountDetails.trim() }).onConflictDoUpdate({ target: [payoutMethods.userId, payoutMethods.method], set: { accountDetails: accountDetails.trim(), updatedAt: new Date() } })
  return { ok: true }
}

export async function requestWithdrawal(amount: number, method: string, accountDetails: string) {
  const userId = await getUserId()
  const details = accountDetails.trim()
  if (!userId || !Number.isFinite(amount) || amount < 5 || amount > 100000 || !validMethods.includes(method as typeof validMethods[number]) || details.length < 4 || details.length > 300) return { ok: false, error: 'Enter a valid payout method, account detail, and amount of at least $5.' }
  const result = await db.transaction(async (tx) => {
    const updated = await tx.update(user).set({ balance: sql`${user.balance} - ${amount.toFixed(2)}` }).where(sql`${user.id} = ${userId} AND ${user.status} = 'active' AND ${user.balance} >= ${amount.toFixed(2)}`).returning({ id: user.id })
    if (updated.length === 0) return false
    await tx.insert(payoutRequests).values({ userId, amount: amount.toFixed(2), method, accountDetails: details })
    return true
  })
  return result ? { ok: true } : { ok: false, error: 'Insufficient available balance.' }
}

export async function getUserPayoutData() {
  const userId = await getUserId()
  if (!userId) return { balance: 0, methods: [], requests: [] }
  const [account] = await db.select({ balance: user.balance }).from(user).where(eq(user.id, userId)).limit(1)
  const methods = await db.select().from(payoutMethods).where(eq(payoutMethods.userId, userId))
  const requests = await db.select().from(payoutRequests).where(eq(payoutRequests.userId, userId)).orderBy(desc(payoutRequests.createdAt))
  return { balance: Number(account?.balance ?? 0), methods, requests }
}

export async function getOwnerPayoutData() {
  if (!(await isOwner())) return null
  return db.select({ request: payoutRequests, name: user.name, username: user.username, email: user.email }).from(payoutRequests).innerJoin(user, eq(payoutRequests.userId, user.id)).where(eq(payoutRequests.status, 'pending')).orderBy(desc(payoutRequests.createdAt))
}

export async function reviewPayout(requestId: number, decision: 'approved' | 'rejected', reason = '') {
  if (!(await isOwner())) return { ok: false, error: 'Unauthorized' }
  const result = await db.transaction(async (tx) => {
    const [request] = await tx.select().from(payoutRequests).where(eq(payoutRequests.id, requestId)).limit(1)
    if (!request || request.status !== 'pending') return false
    if (decision === 'rejected') await tx.update(user).set({ balance: sql`${user.balance} + ${request.amount}` }).where(eq(user.id, request.userId))
    await tx.update(payoutRequests).set({ status: decision, rejectionReason: reason || null, reviewedAt: new Date() }).where(eq(payoutRequests.id, requestId))
    return true
  })
  return result ? { ok: true } : { ok: false, error: 'Request is no longer pending.' }
}
