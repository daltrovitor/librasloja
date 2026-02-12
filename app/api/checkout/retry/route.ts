
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getOrderByExternalId } from '@/lib/orders/service'
import { createStripeCheckoutSession } from '@/lib/payments/stripe'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { orderId } = body // This expects external_id (e.g. ORD-...)

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
        }

        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll() { },
                },
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch Order
        const order = await getOrderByExternalId(orderId)

        // Verify ownership
        if (order.customer_email !== user.email) {
            return NextResponse.json({ error: 'Order not found' }, { status: 403 })
        }

        // Verify status
        if (order.status !== 'PENDING_PAYMENT' && order.status !== 'TEST_ORDER') {
            return NextResponse.json({ error: 'Order is not pending payment' }, { status: 400 })
        }

        // Reconstruct items for Stripe
        const stripeItems = order.items.map((item: any) => ({
            variant_id: item.product_variant_id, // ensure column name matches
            quantity: item.quantity,
            price: item.unit_price,
            name: item.name
        }))

        // Calculate subtotal from items
        const subtotal = order.items.reduce((acc: number, item: any) =>
            acc + (Number(item.unit_price) * Number(item.quantity)), 0
        )

        // Calculate shipping cost as the difference between Total and Subtotal
        // This ensures the Stripe payment matches the Order Total exactly,
        // solving issues where shipping_cost was 0 in DB but Total included it.
        const totalGap = Number(order.total) - subtotal

        // Ensure positive and rounded to 2 decimal places
        const shippingCost = totalGap > 0 ? Math.round(totalGap * 100) / 100 : 0

        const checkoutSession = await createStripeCheckoutSession({
            items: stripeItems,
            customerEmail: user.email,
            successUrl: `${request.headers.get('origin')}/sucesso?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${request.headers.get('origin')}/pedidos`,
            shippingCost: shippingCost,
            metadata: {
                order_id: orderId,
                customer_name: order.customer_name,
                customer_email: order.customer_email,
                is_retry: 'true'
            }
        })

        return NextResponse.json({ checkoutUrl: checkoutSession.checkoutUrl })

    } catch (error) {
        console.error('Retry Checkout Error:', error)
        return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 })
    }
}
