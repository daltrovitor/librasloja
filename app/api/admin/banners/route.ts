
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Simple in-memory fallback if table doesn't exist (temporary)
// But ideally we use a table 'banners'
// Schema assumption: banners (id uuid, title text, image_url text, active boolean, created_at timestamp)

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching banners:', error)
        // If table doesn't exist, return empty to avoid crash
        return NextResponse.json([])
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()

    const { data, error } = await supabase
        .from('banners')
        .insert({
            title: body.title,
            image_url: body.image_url,
            active: body.active !== false
        })
        .select()

    if (error) {
        console.error('Error creating banner:', error)
        return NextResponse.json({
            error: error.message,
            details: error.details,
            hint: error.hint
        }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function DELETE(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
