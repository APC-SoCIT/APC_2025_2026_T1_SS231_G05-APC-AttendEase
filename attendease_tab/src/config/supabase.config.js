import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Add these to your .env.local file:
// SUPABASE_URL=your-project-url
// SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables.');
  console.warn('   Please add SUPABASE_URL and SUPABASE_ANON_KEY to your .env.local file');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check Supabase connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error.message);
    return false;
  }
}

export default supabase;

