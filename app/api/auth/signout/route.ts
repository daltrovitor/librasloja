/**
 * POST /api/auth/signout
 * Logout de usuário
 */

import { NextResponse } from 'next/server'
import { signOut } from '@/lib/auth/service'

export async function POST(request: Request) {
  try {
    await signOut()

    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    })

  } catch (error) {
    console.error('[Auth API] Sign out error:', error)
    
    return NextResponse.json(
      { error: 'Falha ao realizar logout' },
      { status: 500 }
    )
  }
}
