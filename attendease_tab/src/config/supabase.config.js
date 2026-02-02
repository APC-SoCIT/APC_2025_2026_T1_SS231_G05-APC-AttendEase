import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// For Node.js backend: Add these to your .env file:
// SUPABASE_URL=your-project-url
// SUPABASE_SECRET_KEY=your-secret-key
// For Vite frontend: Use VITE_SUPABASE_URL and VITE_SUPABASE_SECRET_KEY

// Check if we're in a browser environment (Vite) or Node.js
const isBrowser = typeof window !== 'undefined';

const supabaseUrl = isBrowser 
  ? import.meta.env.VITE_SUPABASE_URL || ''
  : process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';

const supabaseSecretKey = isBrowser
  ? import.meta.env.VITE_SUPABASE_SECRET_KEY || ''
  : process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_SECRET_KEY || '';

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
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

export default supabase;

