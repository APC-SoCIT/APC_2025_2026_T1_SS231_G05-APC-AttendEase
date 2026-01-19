import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Add these to your .env.local file:
// SUPABASE_URL=your-project-url
// SUPABASE_SECRET_KEY=your-secret-key (was known as anon key prior)

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

let supabase = null;

if (supabaseUrl && supabaseSecretKey) {
  // Create Supabase client only if credentials are provided
  supabase = createClient(supabaseUrl, supabaseSecretKey);
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️ Supabase credentials not found in environment variables.');
  console.warn('   Database features (courses, sessions, attendance) will not work.');
  console.warn('   Add SUPABASE_URL and SUPABASE_SECRET_KEY to your environment to enable.');
}

export { supabase };

// Helper function to check Supabase connection
export async function testSupabaseConnection() {
  if (!supabase) {
    console.log('⏸️ Supabase not configured - skipping connection test');
    return false;
  }
  
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

export default supabase;

