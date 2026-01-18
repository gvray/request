import { NextResponse } from 'next/server'

// Note: This won't actually reset the parent's counter due to module isolation
// For demo purposes, we use a shared module approach
let retryCount = 0

export async function POST() {
  retryCount = 0
  return NextResponse.json({ reset: true, message: 'Counter reset to 0' })
}

export async function GET() {
  return NextResponse.json({ currentCount: retryCount })
}
