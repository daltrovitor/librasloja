
import { NextResponse } from 'next/server'
import { getStripeCheckoutSession } from '@/lib/payments/stripe'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    try {
        const session = await getStripeCheckoutSession(sessionId)

        if (session.payment_status === 'paid') {
            const orderId = session.metadata?.order_id as string

            if (orderId) {
                // Update Order Status
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                )

                const { error } = await supabase
                    .from('orders')
                    .update({
                        status: session.metadata?.is_test === 'true' ? 'TEST_ORDER' : 'PAID',
                        payment_status: 'completed',
                        payment_id: session.payment_intent as string,
                        updated_at: new Date().toISOString()
                    })
                    .eq('external_id', orderId)

                if (error) {
                    console.error('Failed to update order status:', error)
                    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
                }

                return NextResponse.json({ success: true, status: 'paid', orderId })
            }
        }

        return NextResponse.json({ success: true, status: session.payment_status })

    } catch (error: any) {
        console.error('Verification error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
