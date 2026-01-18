import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ currentCount: 0, note: 'Counter is per-request in serverless' })
}
