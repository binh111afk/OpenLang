import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

function getSupabaseBrowserEnv() {
  const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase browser environment variables. Check client/.env.local.',
    );
  }

  return { supabaseUrl, supabaseKey };
}

export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { supabaseUrl, supabaseKey } = getSupabaseBrowserEnv();

  browserClient = createBrowserClient(supabaseUrl, supabaseKey);
  return browserClient;
}
