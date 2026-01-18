import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ms: string }> }
) {
  const { ms: msParam } = await params
  const ms = parseInt(msParam) || 1000
  await new Promise(resolve => setTimeout(resolve, ms))
  return NextResponse.json({ ok: true, delayedMs: ms, time: new Date().toISOString() })
}
