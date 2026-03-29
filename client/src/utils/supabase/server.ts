import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getSupabaseServerEnv() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase server environment variables. Check your local env setup.',
    );
  }

  return { supabaseUrl, supabaseKey };
}

export function createSupabaseServerClient(): SupabaseClient {
  const { supabaseUrl, supabaseKey } = getSupabaseServerEnv();

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
