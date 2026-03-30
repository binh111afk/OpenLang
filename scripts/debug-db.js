const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'client/.env.local'),
  path.resolve(process.cwd(), 'client/.env'),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath, override: false });
}

function getSupabaseServerEnv() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase server environment variables.');
  }

  return { supabaseUrl, supabaseKey };
}

async function main() {
  const { supabaseUrl, supabaseKey } = getSupabaseServerEnv();
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  console.log(JSON.stringify({ count: Array.isArray(data) ? data.length : 0, sample: data || [] }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
