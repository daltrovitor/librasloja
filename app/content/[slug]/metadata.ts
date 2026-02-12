import type { Metadata } from 'next'
import { getSupabaseService } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sbpgoiania.com.br'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug
  try {
    const supabase = getSupabaseService()
    if (!supabase) throw new Error('Supabase not configured')

    const { data } = await supabase.from('contents').select('title, description, image_url').eq('slug', slug).limit(1).single()
    if (data) {
      const title = data.title || `${slug} | SBPG`
      const description = data.description || 'Artigo e conteúdo da SBPG'
      const image = data.image_url || '/spg1.png'

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/content/${slug}`,
          images: [{ url: image, alt: title }],
          type: 'article',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [image],
        },
      }
    }
  } catch (err) {
    // ignore and fallthrough to defaults
  }

  return {
    title: `${slug} | SBPG`,
    description: 'Artigo e conteúdo da SBPG',
    openGraph: {
      title: `${slug} | SBPG`,
      description: 'Artigo e conteúdo da SBPG',
      url: `${SITE_URL}/content/${slug}`,
      images: [{ url: `${SITE_URL}/spg1.png`, alt: 'SBPG' }],
      type: 'article',
    },
  }
}
