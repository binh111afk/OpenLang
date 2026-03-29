const { createClient } = require('@supabase/supabase-js');
const { loadEnvFiles } = require('./env');

loadEnvFiles();

function getSupabaseServerEnv() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY.',
    );
  }

  return { supabaseUrl, supabaseKey };
}

function createSupabaseAdminClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseServerEnv();

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

module.exports = {
  createSupabaseAdminClient,
};
