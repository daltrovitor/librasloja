import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Login direto no Supabase
    const supabase = await getSupabaseServer()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Bypass temporário - qualquer login válido é admin
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: 'Admin MonterCave',
        role: 'admin',
        is_active: true,
      },
    })

  } catch (error) {
    console.error('Simple login error:', error)
    return NextResponse.json(
      { error: 'Erro no login' },
      { status: 500 }
    )
  }
}
