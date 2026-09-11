import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const u = session.user as unknown as { id: string; name: string; email: string; role?: string }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role ?? "user",
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== "admin") throw new Error("Forbidden")
  return user
}
