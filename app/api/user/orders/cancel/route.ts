
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getOrderByExternalId } from '@/lib/orders/service'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { orderId } = body

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
        }

        const cookieStore = await cookies()
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll() { },
                },
            }
        )

        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

        if (authError || !user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch Order to verify ownership
        // We use service role client to fetch order because RLS might restrict if not using supabaseAuth
        // But getOrderByExternalId uses service role internally.
        const order = await getOrderByExternalId(orderId)

        // Verify ownership
        if (order.customer_email !== user.email) {
            return NextResponse.json({ error: 'Order not found' }, { status: 403 })
        }

        // Verify status
        if (order.status !== 'PENDING_PAYMENT') {
            return NextResponse.json({ error: 'Cannot cancel order in current status' }, { status: 400 })
        }

        // Update status using service role
        const supabaseService = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error: updateError } = await supabaseService
            .from('orders')
            .update({ status: 'CANCELED', updated_at: new Date().toISOString() })
            .eq('id', order.id) // Use internal ID for update

        if (updateError) {
            throw updateError
        }

        return NextResponse.json({ success: true, message: 'Order canceled' })

    } catch (error) {
        console.error('Cancel Order Error:', error)
        return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
    }
}
