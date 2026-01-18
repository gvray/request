import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
