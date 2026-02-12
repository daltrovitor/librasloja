
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
    console.log('--- Checking Products Table ---')
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching from products:', error)
    } else {
        console.log('Products sample data (keys):', data.length > 0 ? Object.keys(data[0]) : 'No data')
    }

    console.log('\n--- Checking Tables ---')
    // This query only works if permissions allow or via dashboard, 
    // but let's try to query store_categories to see if it exists
    const { error: catError } = await supabase.from('store_categories').select('count', { count: 'exact', head: true })
    console.log('store_categories exists?', !catError)
    if (catError) console.log('Error:', catError.message)

    const { error: variantError } = await supabase.from('product_variants').select('count', { count: 'exact', head: true })
    console.log('product_variants exists?', !variantError)
    if (variantError) console.log('Error:', variantError.message)
}

checkSchema()
