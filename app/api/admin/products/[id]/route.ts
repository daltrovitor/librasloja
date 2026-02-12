import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { getSupabaseService } from '@/lib/supabase/server'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        if (!id) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'Database service configuration error' }, { status: 500 })
        }

        // Delete product (variants, mockups, etc. are deleted via CASCADE)
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('[Admin Products] Delete Error:', error)
            throw error
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[Admin Products] Delete Error:', error)
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        if (!id) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        const body = await request.json()
        const { name, slug, description, price, thumbnail_url, category_id, is_active, is_featured } = body

        if (!name || !price) {
            return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'Database service configuration error' }, { status: 500 })
        }

        // 1. Update Product
        const { error: productError } = await supabase
            .from('products')
            .update({
                name,
                slug,
                description,
                thumbnail_url,
                category_id,
                is_active,
                is_featured,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (productError) {
            // Check for duplicate slug error (Supabase/Postgres code 23505)
            if (productError.code === '23505') {
                return NextResponse.json({
                    error: 'Já existe um produto com este slug. Tente alterar o slug.',
                    details: productError.details
                }, { status: 409 })
            }
            throw productError
        }

        // 2. Update Default Variant Price (assuming only 1 variant or we update all/first one logic)
        // For simplicity, we update all variants linked to this product to have the new price
        // OR better: find the default variant and update it.
        // Let's just update all variants for this MVP logic as dashboard treats product as single-sku
        const { error: variantError } = await supabase
            .from('product_variants')
            .update({
                price: price,
                retail_price: price,
                updated_at: new Date().toISOString()
            })
            .eq('product_id', id)

        if (variantError) {
            console.error('Error updating variants price:', variantError)
            // Non-critical error, but good to know
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[Admin Products] Update Error:', error)
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
}
