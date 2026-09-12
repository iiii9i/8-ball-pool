'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { links, linkViews, settings, user, payoutMethods, withdrawalRequests, supportTickets, ticketMessages } from '@/lib/db/schema'
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

export async function completeView(slug: string) {
  const [link] = await db.select({ id: links.id }).from(links).where(eq(links.slug, slug)).limit(1)
  if (!link) return { ok: false as const }
  const jar = await cookies()
  let visitorKey = jar.get('sniplink_visitor')?.value
  if (!visitorKey) {
    visitorKey = crypto.randomUUID()
    jar.set('sniplink_visitor', visitorKey, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
  }
  const inserted = await db.insert(linkViews).values({ linkId: link.id, visitorKey }).onConflictDoNothing().returning({ id: linkViews.id })
  if (inserted.length) await db.update(links).set({ clicks: sql`${links.clicks} + 1` }).where(eq(links.id, link.id))
  return { ok: true as const, counted: inserted.length > 0 }
}

export async function getUserLinks() {
  const userId = await getUserId()
  if (!userId) return []

  return db.select().from(links).where(eq(links.userId, userId)).orderBy(desc(links.createdAt))
}

export async function getCPMRate() {
  const [row] = await db.select({ cpmRate: settings.cpmRate }).from(settings).where(eq(settings.id, 1)).limit(1)
  return row ? Number(row.cpmRate) : 3
}

export async function getUserEarnings() {
  const userId = await getUserId()
  if (!userId) return null
  const views = await db.select({ id: linkViews.id }).from(linkViews).innerJoin(links, eq(linkViews.linkId, links.id)).where(eq(links.userId, userId))
  const userLinks = await db.select({ id: links.id }).from(links).where(eq(links.userId, userId))
  const cpm = await getCPMRate()
  const totalViews = views.length
  const earnings = (totalViews / 1000) * cpm
  return { totalClicks: totalViews, earnings, cpm, linkCount: userLinks.length }
}

export async function createSupportTicket(subject: string, message: string) {
  const userId = await getUserId()
  const cleanSubject = subject.trim().slice(0, 160)
  const cleanMessage = message.trim().slice(0, 5000)
  if (!userId || cleanSubject.length < 3 || cleanMessage.length < 3) return { ok: false, error: 'Subject and message are required.' }
  try {
    const [ticket] = await db.insert(supportTickets).values({ userId, subject: cleanSubject }).returning({ id: supportTickets.id })
    if (!ticket) return { ok: false, error: 'Support is temporarily unavailable.' }
    await db.insert(ticketMessages).values({ ticketId: ticket.id, senderRole: 'user', message: cleanMessage })
    return { ok: true, id: ticket.id }
  } catch (error) {
    console.error('[v0] Support ticket creation failed:', error)
    return { ok: false, error: 'Support is temporarily unavailable. Please try again.' }
  }
}

export async function getUserSupportTickets() {
  const userId = await getUserId()
  if (!userId) return []
  return db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.updatedAt))
}

export async function getSupportTicket(ticketId: number) {
  const userId = await getUserId()
  if (!userId) return null
  const [ticket] = await db.select().from(supportTickets).where(sql`${supportTickets.id} = ${ticketId} AND ${supportTickets.userId} = ${userId}`).limit(1)
  if (!ticket) return null
  const messages = await db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, ticketId)).orderBy(ticketMessages.createdAt)
  return { ticket, messages }
}

export async function replyToSupportTicket(ticketId: number, message: string) {
  const userId = await getUserId()
  const clean = message.trim().slice(0, 5000)
  if (!userId || clean.length < 2) return { ok: false, error: 'Message is required.' }
  const [ticket] = await db.select({ id: supportTickets.id }).from(supportTickets).where(sql`${supportTickets.id} = ${ticketId} AND ${supportTickets.userId} = ${userId}`).limit(1)
  if (!ticket) return { ok: false, error: 'Ticket not found.' }
  try {
    await db.insert(ticketMessages).values({ ticketId, senderRole: 'user', message: clean })
    await db.update(supportTickets).set({ status: 'open', updatedAt: new Date() }).where(eq(supportTickets.id, ticketId))
    return { ok: true }
  } catch (error) {
    console.error('[v0] Support reply failed:', error)
    return { ok: false, error: 'Could not send your reply. Please try again.' }
  }
}

// Admin and owner functions
export async function getAllUsers() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!(await isOwner()) && session?.user?.role !== 'admin') return null
  const users = await db.select({ id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, balance: user.balance, status: user.status, createdAt: user.createdAt }).from(user).orderBy(desc(user.createdAt))
  const allLinks = await db.select({ userId: links.userId, linkId: links.id }).from(links)
  const allViews = await db.select({ linkId: linkViews.linkId }).from(linkViews)
  const cpm = await getCPMRate()
  return users.map((item) => { const linkIds = new Set(allLinks.filter((link) => link.userId === item.id).map((link) => link.linkId)); const totalClicks = allViews.filter((view) => linkIds.has(view.linkId)).length; return { ...item, totalClicks, totalRevenue: (totalClicks / 1000) * cpm } })
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
  if (!userId || !Number.isFinite(amount) || amount < 10 || amount > 100000 || !validMethods.includes(method as typeof validMethods[number]) || details.length < 4 || details.length > 300) return { ok: false, error: 'Enter a valid payout method, account detail, and amount of at least $10.' }
  const result = await db.transaction(async (tx) => {
    const [account] = await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for('update').limit(1)
    if (!account) return false
    const [linkRows, requestRows] = await Promise.all([
      tx.select({ id: linkViews.id }).from(linkViews).innerJoin(links, eq(linkViews.linkId, links.id)).where(eq(links.userId, userId)),
      tx.select({ amount: withdrawalRequests.amount }).from(withdrawalRequests).where(sql`${withdrawalRequests.userId} = ${userId} AND ${withdrawalRequests.status} <> 'rejected'`),
    ])
    const available = (linkRows.length / 1000) * await getCPMRate() - requestRows.reduce((total, request) => total + Number(request.amount), 0)
    if (available < amount) return false
    await tx.insert(withdrawalRequests).values({ userId, amount: amount.toFixed(2), paymentMethod: method, accountNumber: details })
    return true
  })
  return result ? { ok: true } : { ok: false, error: 'Insufficient available balance.' }
}

export async function getUserPayoutData() {
  const userId = await getUserId()
  if (!userId) return { balance: 0, methods: [], requests: [] }
  const [methods, requests, earnings] = await Promise.all([
    db.select().from(payoutMethods).where(eq(payoutMethods.userId, userId)),
    db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, userId)).orderBy(desc(withdrawalRequests.createdAt)),
    getUserEarnings(),
  ])
  const committed = requests.filter((request) => request.status !== 'rejected').reduce((total, request) => total + Number(request.amount), 0)
  return { balance: Math.max(0, (earnings?.earnings ?? 0) - committed), methods, requests }
}

export async function getAdminWithdrawals() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user?.role !== 'admin') return null
  return db.select({ request: withdrawalRequests, name: user.name, username: user.username, email: user.email }).from(withdrawalRequests).innerJoin(user, eq(withdrawalRequests.userId, user.id)).orderBy(desc(withdrawalRequests.createdAt))
}

export async function getOwnerPayoutData() {
  if (!(await isOwner())) return null
  return getAdminWithdrawals()
}

export async function reviewWithdrawal(requestId: number, decision: 'approved' | 'rejected', reason = '') {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user?.role !== 'admin' || !['approved', 'rejected'].includes(decision)) return { ok: false, error: 'Unauthorized' }
  const [request] = await db.select({ id: withdrawalRequests.id, status: withdrawalRequests.status }).from(withdrawalRequests).where(eq(withdrawalRequests.id, requestId)).limit(1)
  if (!request || request.status !== 'pending') return { ok: false, error: 'Request is no longer pending.' }
  await db.update(withdrawalRequests).set({ status: decision, reason: reason.trim() || null, reviewedAt: new Date() }).where(eq(withdrawalRequests.id, requestId))
  return { ok: true }
}

export async function reviewPayout(requestId: number, decision: 'approved' | 'rejected', reason = '') {
  if (!(await isOwner())) return { ok: false, error: 'Unauthorized' }
  const result = await db.transaction(async (tx) => {
    const [request] = await tx.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, requestId)).limit(1)
    if (!request || request.status !== 'pending') return false
    await tx.update(withdrawalRequests).set({ status: decision, reason: reason || null, reviewedAt: new Date() }).where(eq(withdrawalRequests.id, requestId))
    return true
  })
  return result ? { ok: true } : { ok: false, error: 'Request is no longer pending.' }
}
