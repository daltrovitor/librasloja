
/**
 * POST /api/checkout/create
 * Cria uma sessão de checkout para pagamento
 */

import { NextResponse } from 'next/server'
import { createStripeCheckoutSession } from '@/lib/payments/stripe'
import { createOrder } from '@/lib/orders/service'
import { z } from 'zod'

// Schema de validação
const CheckoutSchema = z.object({
    items: z.array(z.object({
        variant_id: z.string().uuid(),
        quantity: z.number().min(1),
        price: z.number().min(0),
        name: z.string(),
    })),
    customer: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
    }),
    shipping_address: z.object({
        name: z.string(),
        address1: z.string(),
        address2: z.string().optional(),
        city: z.string(),
        state_code: z.string(),
        country_code: z.string(),
        zip: z.string(),
        phone: z.string().optional(),
        email: z.string().email(),
    }),
    shipping_cost: z.number().optional().default(0),
    success_url: z.string().url(),
    cancel_url: z.string().url(),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Valida dados de entrada
        const validatedData = CheckoutSchema.parse(body)

        // Verifica modo de teste
        const isTestMode = process.env.PAYMENT_MODE === 'test'

        // Cria pedido no sistema
        const orderResult = await createOrder({
            customerName: validatedData.customer.name,
            customerEmail: validatedData.customer.email,
            customerPhone: validatedData.customer.phone,
            shippingAddress: validatedData.shipping_address,
            items: validatedData.items,
            isTest: isTestMode,
            shippingCost: validatedData.shipping_cost,
        })

        // Cria sessão de checkout no Stripe (se configurado)
        let checkoutUrl = null;
        let checkoutSessionId = null;

        if (process.env.STRIPE_SECRET_KEY) {
            const checkoutSession = await createStripeCheckoutSession({
                items: validatedData.items,
                customerEmail: validatedData.customer.email,
                successUrl: `${validatedData.success_url}?order_id=${orderResult.orderId}&session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: validatedData.cancel_url,
                shippingCost: validatedData.shipping_cost,
                metadata: {
                    order_id: orderResult.orderId,
                    customer_name: validatedData.customer.name,
                    customer_email: validatedData.customer.email,
                },
            })
            checkoutUrl = checkoutSession.checkoutUrl;
            checkoutSessionId = checkoutSession.sessionId;
        }

        return NextResponse.json({
            success: true,
            order_id: orderResult.orderId,
            total: orderResult.total,
            checkout_session_id: checkoutSessionId,
            checkout_url: checkoutUrl,
        })

    } catch (error) {
        console.error('[Checkout] Erro ao criar checkout:', error)

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

        return NextResponse.json(
            {
                error: 'Falha ao criar checkout',
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            { status: 500 }
        )
    }
}
