const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (data && data[0]) {
        const keys = Object.keys(data[0]);
        console.log('--- COLUMNS START ---');
        keys.forEach(k => console.log(k));
        console.log('--- COLUMNS END ---');
        if (keys.includes('role')) {
            console.log('RESULT: ROLE_COLUMN_EXISTS');
        } else {
            console.log('RESULT: ROLE_COLUMN_MISSING');
        }
    } else {
        console.log('RESULT: NO_DATA');
    }
}
check();
