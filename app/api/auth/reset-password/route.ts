/**
 * POST /api/auth/reset-password
 * Solicitação de reset de senha
 */

import { NextResponse } from 'next/server'
import { resetPassword } from '@/lib/auth/service'
import { z } from 'zod'

const ResetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = ResetPasswordSchema.parse(body)

    await resetPassword(email)

    return NextResponse.json({
      success: true,
      message: 'Email de recuperação enviado! Verifique sua caixa de entrada.',
    })

  } catch (error) {
    console.error('[Auth API] Reset password error:', error)
    
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

    // Sempre retorna sucesso para não revelar se email existe
    return NextResponse.json({
      success: true,
      message: 'Se o email estiver cadastrado, enviaremos um link de recuperação.',
    })
  }
}
