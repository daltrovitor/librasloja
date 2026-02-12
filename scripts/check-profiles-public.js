
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkProfilesPublic() {
    console.log('--- Checking Profiles (Public) ---')
    const { data, error } = await supabase
        .from('profiles')
        .select('email, role')

    if (error) {
        console.error('Error (expected if RLS is on):', error.message)
    } else {
        console.log('Publicly visible profiles:', data)
    }
}

checkProfilesPublic()
