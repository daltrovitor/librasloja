const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (data && data[0]) {
        console.log('ALL_COLS:' + Object.keys(data[0]).join('|'));
    } else {
        console.log('ERROR_OR_EMPTY:' + (error ? error.message : 'no data'));
    }
}
check();
