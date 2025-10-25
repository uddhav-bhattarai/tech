import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  return NextResponse.json({
    session,
    message: 'Current session information'
  })
}

export async function DELETE(request: NextRequest) {
  // This will help clear the session by returning a sign out response
  return NextResponse.json({
    message: 'Sign out from your browser and sign in again with admin@techblog.com'
  })
}