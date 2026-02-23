// One-time script to add course_schedule_id column to sessions table
// Run with: node scripts/add_schedule_column.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evbggbkvsrvashrjmdha.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YmdnYmt2c3J2YXNocmptZGhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODgwMjUyMCwiZXhwIjoyMDg0Mzc4NTIwfQ.34J0M75M2QvaTAegMnr8IIR0WDdqGfah28386ysextY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
    console.log('Attempting to add course_schedule_id column to sessions table...');

    // Try using Supabase SQL (available via the management API)
    const { data, error } = await supabase.rpc('exec_sql', {
        query: 'ALTER TABLE sessions ADD COLUMN IF NOT EXISTS course_schedule_id UUID REFERENCES course_schedules(id)'
    });

    if (error) {
        console.log('RPC exec_sql not available:', error.message);
        console.log('');
        console.log('Please add the column manually in the Supabase Dashboard:');
        console.log('1. Go to https://app.supabase.com/project/evbggbkvsrvashrjmdha/sql/new');
        console.log('2. Run this SQL:');
        console.log('   ALTER TABLE sessions ADD COLUMN IF NOT EXISTS course_schedule_id UUID REFERENCES course_schedules(id);');
        console.log('');
        console.log('Or add it via Table Editor:');
        console.log('1. Go to Table Editor > sessions');
        console.log('2. Add a new column: course_schedule_id, type: uuid, nullable');
    } else {
        console.log('Column added successfully!', data);
    }
}

addColumn();
