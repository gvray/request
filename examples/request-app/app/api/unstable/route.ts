import { NextRequest, NextResponse } from 'next/server'

// In-memory counter (resets on server restart)
let retryCount = 0

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const failTimes = parseInt(searchParams.get('failTimes') || '2')
  
  retryCount++
  console.log(`[Unstable API] Attempt ${retryCount}, failTimes=${failTimes}`)
  
  if (retryCount <= failTimes) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', attempt: retryCount },
      { status: 503 }
    )
  }
  
  const result = { ok: true, attempt: retryCount, message: 'Success after retries' }
  retryCount = 0 // Reset for next test
  return NextResponse.json(result)
}

export { retryCount }
