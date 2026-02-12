
import { NextResponse } from 'next/server'
import { processStripeWebhook } from '@/lib/payments/stripe'

export async function POST(req: Request) {
    try {
        const body = await req.text()
        const signature = req.headers.get('stripe-signature')

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing stripe-signature header' },
                { status: 400 }
            )
        }

        const result = await processStripeWebhook(body, signature)

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Webhook error:', error.message)
        return NextResponse.json(
            { error: error.message || 'Webhook failed' },
            { status: 400 }
        )
    }
}
