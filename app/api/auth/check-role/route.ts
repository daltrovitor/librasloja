
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: 'UserId required' }, { status: 400 })
        }

        // Usar chave de serviço para ignorar RLS e garantir leitura correta
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('user_id', userId)
            .single()

        if (error) {
            console.error('Error fetching role (admin bypass):', error)
            return NextResponse.json({ role: 'customer' }) // Fallback seguro
        }

        return NextResponse.json({ role: profile?.role || 'customer' })
    } catch (error) {
        console.error('Server error checking role:', error)
        return NextResponse.json({ role: 'customer' }, { status: 500 })
    }
}
