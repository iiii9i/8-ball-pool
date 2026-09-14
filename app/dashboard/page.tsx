import { auth } from '@/lib/auth'
import { getUserEarnings, getUserLinks, getUserPayoutData, getUserSupportTickets } from '@/app/actions/links'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const [stats, links, payoutData, tickets] = await Promise.all([getUserEarnings(), getUserLinks(), getUserPayoutData(), getUserSupportTickets()])
  return <DashboardClient initialData={{ stats, links, payoutData, tickets, userName: session.user.name }} />
}
