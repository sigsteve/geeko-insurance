import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const body = await request.json()
  const { username, password } = body

  if (username === 'suse' && password === 'heygeeko') {
    // Set HTTP-only cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('isAuthenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    
    return response
  }

  return NextResponse.json({ success: false }, { status: 401 })
} 