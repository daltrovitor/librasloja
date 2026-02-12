const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in profiles table:', Object.keys(data[0]).join(', '));
    } else {
        console.log('No data in profiles table to check columns.');
        // Try to get column info from information_schema
        const { data: colData, error: colError } = await supabase
            .rpc('get_table_columns', { table_name: 'profiles' });

        if (colError) {
            console.log('Fallback to direct SQL via RPC failed. Trying a dummy select.');
            const { data: dummyData, error: dummyError } = await supabase.from('profiles').select().limit(0);
            console.log('Dummy select error (if any):', dummyError);
            console.log('Dummy select data keys:', dummyData ? Object.keys(dummyData[0] || {}) : 'null');
        } else {
            console.log('Columns from RPC:', colData);
        }
    }
}

checkColumns();
