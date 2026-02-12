/**
 * POST /api/auth/signin
 * Login de usuário
 */

import { NextResponse } from 'next/server'
import { signIn } from '@/lib/auth/service'
import { z } from 'zod'

const SignInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = SignInSchema.parse(body)

    const data = await signIn(email, password)
    const userId = data.user?.id

    if (!userId) {
      throw new Error('User ID not found after sign in')
    }

    // Buscar o perfil completo para saber o role
    // Usamos Service Role para garantir acesso mesmo se RLS estiver bloqueando
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Tenta buscar o role, mas não quebra se falhar (ex: coluna não existe ainda)
    let userRole = 'customer'
    try {
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (profileError) {
        console.warn('[Auth API] Profile fetch error (non-fatal):', profileError.message)
      } else if (profile?.role) {
        userRole = profile.role
      }
    } catch (err) {
      console.warn('[Auth API] Failed to fetch role (non-fatal):', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: userId,
        email: data.user?.email,
        role: userRole
      }
    })

  } catch (error) {
    console.error('[Auth API] Sign in error:', error)

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
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Email ou senha incorretos' },
          { status: 401 }
        )
      }

      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Email não confirmado. Verifique sua caixa de entrada.' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Falha ao realizar login' },
      { status: 500 }
    )
  }
}
