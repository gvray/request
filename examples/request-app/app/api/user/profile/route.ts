import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ 
    id: 1, 
    name: 'Alice', 
    email: 'alice@example.com', 
    avatar: 'https://i.pravatar.cc/150' 
  })
}
