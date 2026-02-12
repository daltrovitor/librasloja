const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') }); // Adjust path if needed

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    try {
        const { data, error } = await supabase.from('orders').select('*').limit(1);

        if (error) {
            console.error('Error fetching orders:', error.message);
            return;
        }

        if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            console.log('Columns in orders table:', columns);
            if (columns.includes('shipping_cost')) {
                console.log('SUCCESS: shipping_cost column exists.');
            } else {
                console.log('FAILURE: shipping_cost column MISSING.');
            }
        } else {
            console.log('Orders table is empty, cannot verify columns by select *.');
            // Try inserting a dummy row with shipping_cost? Risks failing constraints.
            // But if empty, we can just say "Probably missing".
        }
    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

check();
