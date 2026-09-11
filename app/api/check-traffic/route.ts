import { NextResponse } from 'next/server'

export async function GET() {
  // Production deployments should replace this conservative hook with an IP reputation provider.
  // We never treat normal Vercel forwarding headers as VPN evidence.
  return NextResponse.json({ vpnDetected: false })
}
