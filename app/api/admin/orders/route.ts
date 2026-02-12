/**
 * GET /api/admin/orders
 * APIs administrativas para gerenciamento de pedidos
 */

import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { getSupabaseService } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema para filtros
const OrdersFilterSchema = z.object({
    status: z.string().optional(),
    customer_email: z.string().optional(),
    is_test: z.boolean().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
})

// Middleware de autenticação - substituído por checkAdminAuth

/**
 * GET - Lista pedidos com filtros
 */
export async function GET(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
        }
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        // Valida filtros
        const filters = OrdersFilterSchema.parse({
            status: searchParams.get('status') || undefined,
            customer_email: searchParams.get('customer_email') || undefined,
            is_test: searchParams.get('is_test') === 'true' ? true :
                searchParams.get('is_test') === 'false' ? false : undefined,
            date_from: searchParams.get('date_from') || undefined,
            date_to: searchParams.get('date_to') || undefined,
        })

        let query = supabase
            .from('orders')
            .select(`
                *,
                items:order_items(
                    *,
                    product_variant:product_variants(
                        *,
                        product:products(name, thumbnail_url)
                    )
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })

        // Aplica filtros
        if (filters.status) {
            query = query.eq('status', filters.status)
        }

        if (filters.customer_email) {
            query = query.ilike('customer_email', `%${filters.customer_email}%`)
        }

        if (filters.is_test !== undefined) {
            query = query.eq('is_test', filters.is_test)
        }

        if (filters.date_from) {
            query = query.gte('created_at', filters.date_from)
        }

        if (filters.date_to) {
            query = query.lte('created_at', filters.date_to)
        }

        // Paginação
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) throw error

        // Calcula estatísticas
        const { data: stats } = await supabase
            .from('orders')
            .select('status, total, is_test')
            .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())

        const statsSummary = {
            total_orders: count || 0,
            total_revenue: stats?.reduce((sum, order) =>
                !order.is_test ? sum + parseFloat(order.total) : sum, 0) || 0,
            status_counts: stats?.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1
                return acc
            }, {} as Record<string, number>) || {},
        }

        return NextResponse.json({
            orders: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
            stats: statsSummary,
        })

    } catch (error) {
        console.error('[Admin Orders] Erro ao listar pedidos:', error)
        return NextResponse.json(
            { error: 'Falha ao listar pedidos' },
            { status: 500 }
        )
    }
}

/**
 * POST - Atualiza status de pedidos ou outras ações
 */
export async function POST(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
        }
        const body = await request.json()
        const { action, data } = body

        switch (action) {
            case 'update_status': {
                const { orderIds, status } = data
                if (!Array.isArray(orderIds) || !status) {
                    return NextResponse.json(
                        { error: 'orderIds e status são obrigatórios' },
                        { status: 400 }
                    )
                }

                const { error } = await supabase
                    .from('orders')
                    .update({
                        status,
                        updated_at: new Date().toISOString(),
                    })
                    .in('id', orderIds)

                if (error) throw error

                return NextResponse.json({
                    success: true,
                    message: `Status atualizado para ${orderIds.length} pedido(s)`,
                })
            }

            case 'get_details': {
                const { orderId } = data
                if (!orderId) {
                    return NextResponse.json(
                        { error: 'ID do pedido não informado' },
                        { status: 400 }
                    )
                }

                const { data: order, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        items:order_items(
                            *,
                            product_variant:product_variants(
                                *,
                                product:products(name, thumbnail_url, printful_id)
                            )
                        )
                    `)
                    .eq('id', orderId)
                    .single()

                if (error) throw error

                return NextResponse.json({
                    success: true,
                    order,
                })
            }

            default:
                return NextResponse.json(
                    { error: 'Ação não reconhecida' },
                    { status: 400 }
                )
        }

    } catch (error) {
        console.error('[Admin Orders] Erro na operação:', error)
        return NextResponse.json(
            { error: 'Falha na operação' },
            { status: 500 }
        )
    }
}
