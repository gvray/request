import { NextResponse } from 'next/server'

// Store token in memory (for demo only)
let accessToken = 'token-initial'

export async function POST() {
  accessToken = `token-${Date.now()}`
  return NextResponse.json({ 
    token: accessToken, 
    accessToken,
    refreshToken: `refresh-${Date.now()}` 
  })
}

export { accessToken }
