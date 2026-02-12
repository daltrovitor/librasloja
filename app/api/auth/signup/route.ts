/**
 * POST /api/auth/signup
 * Registro de novo usuário
 */

import { NextResponse } from 'next/server'
import { signUp } from '@/lib/auth/service'
import { z } from 'zod'

const SignUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, fullName } = SignUpSchema.parse(body)

    const data = await signUp(email, password, fullName)

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso! Verifique seu email para confirmar.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      }
    })

  } catch (error) {
    console.error('[Auth API] Sign up error:', error)
    
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

    // Erros do Supabase
    if (error instanceof Error) {
      if (error.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Falha ao criar conta' },
      { status: 500 }
    )
  }
}
