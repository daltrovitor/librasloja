
import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await getSupabaseServer()
        const { searchParams } = new URL(request.url)
        const categoryId = searchParams.get('categoryId')
        const featured = searchParams.get('featured') === 'true'

        let query = supabase
            .from('products')
            .select(`
                *,
                variants:product_variants(*),
                mockups:product_mockups(*)
            `)
            .eq('is_active', true)

        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }

        const search = searchParams.get('search')
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        }

        if (featured) {
            query = query.eq('is_featured', true)
        }

        const { data, error } = await query

        if (error) throw error

        // Transform data to match Product type if necessary
        // The query returns snake_case which matches our DB, 
        // and our types in lib/store/types.ts should ideally match this or be mapped.
        // For now assuming snake_case in types.ts (I should check that).
        // Check: lib/store/types.ts I wrote uses snake_case for most fields (created_at, is_active), 
        // but camelCase for some (thumbnailUrl? No, I wrote thumbnail_url).
        // Let's verify types.ts.

        return NextResponse.json(data || [])

    } catch (error) {
        console.error('[Products API] Error fetching products:', error)
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        )
    }
}
