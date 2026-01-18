import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
}
