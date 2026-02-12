
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAdminUser() {
    console.log('--- Checking Profiles ---')
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')

    if (error) {
        console.error('Error fetching profiles:', error)
    } else {
        console.log('Found admins:', data.map(p => ({ email: p.email, role: p.role })))
    }

    const { data: allProfiles, error: allErr } = await supabase.from('profiles').select('*')
    if (allErr) {
        console.error('Error fetching all profiles:', allErr)
    } else {
        console.log('All profiles:', allProfiles.map(p => ({ email: p.email, role: p.role })))
    }
}

checkAdminUser()
