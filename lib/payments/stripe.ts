/**
 * Stripe Payment Service
 * Serviço para processamento de pagamentos via Stripe
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

import { getStripeConfig, isTestMode } from '@/lib/config/app'

// Inicializa Stripe com a chave apropriada (produção ou teste)
function getStripeClient(): Stripe {
    const config = getStripeConfig()

    return new Stripe(config.secretKey!, {
        typescript: true,
    })
}

/**
 * Cria uma sessão de checkout do Stripe
 */
export async function createStripeCheckoutSession(params: {
    items: Array<{
        variant_id: string
        quantity: number
        price: number
        name: string
    }>
    customerEmail: string
    successUrl: string
    cancelUrl: string
    metadata?: Record<string, string>
    shippingCost?: number
}): Promise<{ sessionId: string; checkoutUrl: string }> {
    const stripe = getStripeClient()
    const isTestMode = process.env.PAYMENT_MODE === 'test'

    // Validação de segurança: busca preços reais no banco
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const lineItems = []
    let totalAmount = 0

    for (const item of params.items) {
        // Busca variante no banco para validar preço
        const { data: variant, error } = await supabase
            .from('product_variants')
            .select('price, retail_price, name, in_stock') // Check retail_price too
            .eq('id', item.variant_id)
            .single()

        if (error || !variant) {
            throw new Error(`Variante ${item.variant_id} não encontrada`)
        }

        if (!variant.in_stock) {
            throw new Error(`Variante ${item.name} está sem estoque`)
        }

        // Use retail_price if available, otherwise price
        const dbPrice = variant.retail_price || variant.price

        // Valida se o preço enviado corresponde ao preço no banco (allow small diff)
        if (Math.abs(dbPrice - item.price) > 0.1) {
            // For now, log warning but use DB price to be safe
            console.warn(`Price mismatch for ${item.name}: sent ${item.price}, db ${dbPrice}`)
        }

        const effectivePrice = dbPrice
        const itemTotal = effectivePrice * item.quantity
        totalAmount += itemTotal

        lineItems.push({
            price_data: {
                currency: 'brl',
                product_data: {
                    name: variant.name, // Use name from DB
                    metadata: {
                        variant_id: item.variant_id,
                    },
                },
                unit_amount: Math.round(effectivePrice * 100), // Stripe usa centavos
            },
            quantity: item.quantity,
        })
    }

    // Add Shipping Cost if present
    if (params.shippingCost && params.shippingCost > 0) {
        lineItems.push({
            price_data: {
                currency: 'brl',
                product_data: {
                    name: 'Frete e Entrega',
                },
                unit_amount: Math.round(params.shippingCost * 100),
            },
            quantity: 1,
        })
        totalAmount += params.shippingCost
    }

    // Cria sessão de checkout
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        customer_email: params.customerEmail,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
            ...params.metadata,
            is_test: isTestMode.toString(),
            total_amount: totalAmount.toString(),
        },
        // Em modo teste, permite pagamentos de teste
        payment_intent_data: isTestMode ? {
            setup_future_usage: 'off_session',
        } : undefined,
    })

    return {
        sessionId: session.id,
        checkoutUrl: session.url!,
    }
}

/**
 * Verifica o status de uma sessão de pagamento
 */
export async function getStripeCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    const stripe = getStripeClient()
    return await stripe.checkout.sessions.retrieve(sessionId)
}

/**
 * Processa webhook do Stripe
 */
export async function processStripeWebhook(
    body: string,
    signature: string
): Promise<{ processed: boolean; type: string; data?: any }> {
    const stripe = getStripeClient()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET não configurado')
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
        console.error('[Stripe] Webhook signature verification failed:', err)
        throw new Error('Assinatura do webhook inválida')
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session

            if (session.payment_status === 'paid') {
                // Atualiza status do pedido
                const orderId = session.metadata?.order_id

                if (orderId) {
                    await supabase
                        .from('orders')
                        .update({
                            status: session.metadata?.is_test === 'true' ? 'TEST_ORDER' : 'PAID',
                            payment_status: 'completed',
                            payment_id: session.payment_intent as string,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('external_id', orderId)

                    console.log(`[Stripe] Pedido ${orderId} pago com sucesso`)

                    // TODO: Disparar criação de pedido no Printful
                    // Isso será feito em um serviço separado
                }
            }

            return {
                processed: true,
                type: event.type,
                data: session,
            }
        }

        case 'checkout.session.expired': {
            const session = event.data.object as Stripe.Checkout.Session
            const orderId = session.metadata?.order_id

            if (orderId) {
                await supabase
                    .from('orders')
                    .update({
                        status: 'CANCELED',
                        payment_status: 'expired',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('external_id', orderId)
            }

            return {
                processed: true,
                type: event.type,
                data: session,
            }
        }

        default:
            console.log(`[Stripe] Evento não processado: ${event.type}`)
            return {
                processed: false,
                type: event.type,
            }
    }
}

/**
 * Formata valor para Stripe (centavos)
 */
export function formatAmountForStripe(amount: number): number {
    return Math.round(amount * 100)
}

/**
 * Formata valor do Stripe para real (reais)
 */
export function formatAmountFromStripe(amount: number): number {
    return amount / 100
}

export default {
    createStripeCheckoutSession,
    getStripeCheckoutSession,
    processStripeWebhook,
    formatAmountForStripe,
    formatAmountFromStripe,
}
