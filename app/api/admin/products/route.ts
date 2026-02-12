
import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { getSupabaseService } from '@/lib/supabase/server'
import { z } from 'zod'

const ProductSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
    price: z.number().min(0),
    thumbnail_url: z.string().optional(),
    images: z.array(z.string()).optional(),
    category_id: z.string().uuid().optional().nullable(),
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
})

export async function GET(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use SERVICE ROLE to ensure admins can see all products regardless of RLS
        const supabase = getSupabaseService()
        if (!supabase) {
            throw new Error('Supabase Service Role Key is missing')
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data, count, error } = await supabase
            .from('products')
            .select('*, variants:product_variants(*)', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
            products: data || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        })

    } catch (error) {
        console.error('[Admin Products] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use SERVICE ROLE to bypass RLS on admin operations
        const supabase = getSupabaseService()
        if (!supabase) {
            console.error('getSupabaseService returned null')
            return NextResponse.json({ error: 'Database service configuration error' }, { status: 500 })
        }

        const body = await request.json()

        // Basic validation
        const validatedData = ProductSchema.parse(body)

        // 1. Create Product
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert({
                name: validatedData.name,
                slug: validatedData.slug,
                description: validatedData.description,
                thumbnail_url: validatedData.thumbnail_url,
                category_id: validatedData.category_id,
                is_active: validatedData.is_active,
                is_featured: validatedData.is_featured,
                printful_id: 'local-' + Date.now(),
            })
            .select()
            .single()

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

        // 2. Create Default Variant
        const { error: variantError } = await supabase
            .from('product_variants')
            .insert({
                product_id: product.id,
                name: 'Default',
                price: validatedData.price,
                retail_price: validatedData.price,
                printful_variant_id: 'local-' + Date.now(),
            })

        if (variantError) {
            console.error('Error creating default variant:', variantError)
        }

        // 3. Create Mockups (Images)
        if (validatedData.images && validatedData.images.length > 0) {
            const mockups = validatedData.images.map((url: string, index: number) => ({
                product_id: product.id,
                image_url: url,
                display_order: index,
                is_main: index === 0
            }))

            await supabase.from('product_mockups').insert(mockups)
        }

        return NextResponse.json({ success: true, product })

    } catch (error) {
        console.error('[Admin Products] Create Error:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
}
