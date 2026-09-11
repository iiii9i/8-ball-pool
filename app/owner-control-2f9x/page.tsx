import { auth } from '@/lib/auth'
import { getAllUsers, getCPMRate } from '@/app/actions/links'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { OwnerConsole } from '@/components/owner-console'

export const dynamic = 'force-dynamic'

export default async function OwnerPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const users = session?.user?.role === 'admin' ? await getAllUsers() : []
  return <OwnerConsole initialUsers={users ?? []} currentRate={await getCPMRate()} />
}
