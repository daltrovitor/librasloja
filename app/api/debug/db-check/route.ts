import { NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseService()
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'SUPABASE_SERVICE_ROLE_KEY not configured on server' }, { status: 500 })
    }

    // Check tables by attempting a safe select (limit 1)
    const checks: Record<string, any> = {}

    const tables = ['profiles', 'customer_addresses']
    for (const t of tables) {
      try {
        const { data, error } = await supabaseAdmin.from(t).select('id').limit(1)
        if (error) {
          checks[t] = { exists: false, error: String(error.message || error) }
        } else {
          checks[t] = { exists: Array.isArray(data) }
        }
      } catch (e) {
        checks[t] = { exists: false, error: String(e) }
      }
    }

    return NextResponse.json({ ok: true, checks })
  } catch (error) {
    console.error('[Debug] DB check error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
