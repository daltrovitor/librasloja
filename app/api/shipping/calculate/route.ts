
import { NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { state } = body

        if (!state) {
            return NextResponse.json({ error: 'State code required' }, { status: 400 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'DB Service Error' }, { status: 500 })
        }

        // 1. Try to find specific rule
        const { data: specificRule } = await supabase
            .from('shipping_rules')
            .select('price')
            .eq('state_code', state.toUpperCase())
            .single()

        if (specificRule) {
            return NextResponse.json({ price: specificRule.price })
        }

        // 2. If not found, find default rule (XX)
        const { data: defaultRule } = await supabase
            .from('shipping_rules')
            .select('price')
            .eq('state_code', 'XX')
            .single()

        return NextResponse.json({ price: defaultRule ? defaultRule.price : 0 })

    } catch (error) {
        console.error('Error calculating shipping:', error)
        return NextResponse.json({ error: 'Failed to calculate shipping' }, { status: 500 })
    }
}
