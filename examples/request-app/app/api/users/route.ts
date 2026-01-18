import { NextRequest, NextResponse } from 'next/server'

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
]

export async function GET() {
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json(
    { id: Date.now(), ...body, createdAt: new Date().toISOString() },
    { status: 201 }
  )
}
