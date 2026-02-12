import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServer()

    // 1. Get current authenticated user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Fetch profile to check role (using admin client to bypass RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let profile = null
    try {
      const { data, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('[api/admin/me] Profile error:', profileError.message)
        return NextResponse.json({ error: 'Perfil não encontrado ou erro no banco' }, { status: 404 })
      }
      profile = data
    } catch (err) {
      console.error('[api/admin/me] Crash fetching profile:', err)
      return NextResponse.json({ error: 'Erro ao acessar tabela de perfis.' }, { status: 500 })
    }

    // 3. Verify admin/manager role
    if (!profile.role || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso negado: você não tem permissão de admin' }, { status: 403 })
    }

    // Return administrative user data
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        role: profile.role,
        is_active: profile.is_active,
      },
    })

  } catch (error) {
    console.error('[api/admin/me] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
