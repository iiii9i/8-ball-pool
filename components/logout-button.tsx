'use client'

import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()
  return <button aria-label="Sign out" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary" onClick={async () => { await signOut(); router.push('/'); router.refresh() }}><LogOut className="size-4" /></button>
}
