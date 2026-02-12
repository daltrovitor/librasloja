/**
 * GET /api/auth/me
 * Obtém informações do usuário atual
 */

import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth/service'

export async function GET(request: Request) {
  try {
    const profile = await getCurrentProfile()

    if (!profile) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: profile
    })

  } catch (error) {
    console.error('[Auth API] Get profile error:', error)
    
    return NextResponse.json(
      { error: 'Falha ao obter informações do usuário' },
      { status: 500 }
    )
  }
}
