import { NextResponse } from 'next/server'

export async function POST() {
  const newToken = `token-${Date.now()}`
  return NextResponse.json({ 
    token: newToken, 
    refreshToken: `refresh-${Date.now()}` 
  })
}
