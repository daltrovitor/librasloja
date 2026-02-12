import { MetadataRoute } from 'next'
import { getSupabaseService } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const SITE_URL = 'https://loja.libraslixas.com.br'

    // Rotas estáticas
    const routes = [
        '',
        '/loja',
        '/login',
        '/signup',
    ].map((route) => ({
        url: `${SITE_URL}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    try {
        const supabase = getSupabaseService()
        if (!supabase) return routes

        // Buscar todos os produtos
        const { data: products } = await supabase
            .from('products')
            .select('slug, updated_at')
            .eq('is_active', true)

        const productEntries = (products || []).map((product) => ({
            url: `${SITE_URL}/produto/${product.slug}`,
            lastModified: product.updated_at || new Date().toISOString(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }))

        return [...routes, ...productEntries]
    } catch (error) {
        console.error('Sitemap error:', error)
        return routes
    }
}
