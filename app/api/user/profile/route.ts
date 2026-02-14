/**
 * GET /api/user/profile - Obter perfil do usuário
 * PUT /api/user/profile - Atualizar perfil do usuário
 */

import { NextResponse } from 'next/server'
import { getCurrentProfile, updateProfile } from '@/lib/auth/service'
import { withCustomerAuth } from '@/lib/auth/middleware'
import { z } from 'zod'

const UpdateProfileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  phone: z.string().optional(),
  avatar_url: z.string().optional().refine((v) => {
    if (!v) return true
    try {
      // Accept only valid http/https URLs, but allow empty string (to clear avatar)
      const u = new URL(v)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }, { message: 'URL inválida' }),
})

// GET - Obter perfil
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
      profile
    })

  } catch (error) {
    console.error('[User API] Get profile error:', error)
    const message = (error instanceof Error && error.message) ? error.message : 'Falha ao obter perfil'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// PUT - Atualizar perfil
export const PUT = withCustomerAuth(async (request: Request) => {
  try {
    const body = await request.json()
    const updates = UpdateProfileSchema.parse(body)

    const updatedProfile = await updateProfile(updates)

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      profile: updatedProfile
    })

  } catch (error) {
    console.error('[User API] Update profile error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      )
    }
    const message = (error instanceof Error && error.message) ? error.message : 'Falha ao atualizar perfil'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
})
