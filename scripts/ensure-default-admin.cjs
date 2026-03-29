const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = '123456';
const DEFAULT_EMAIL = 'admin@openlang.local';

function loadEnv() {
  const root = process.cwd();
  const envPaths = [
    path.join(root, '.env.local'),
    path.join(root, '.env'),
    path.join(root, 'client', '.env.local'),
    path.join(root, 'client', '.env'),
  ];

  for (const envPath of envPaths) {
    dotenv.config({ path: envPath, override: false });
  }
}

function getSupabaseAdminEnv() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY.');
  }

  return { supabaseUrl, serviceRoleKey };
}

async function findAuthUserByEmail(supabase, email) {
  const normalized = String(email || '').toLowerCase();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message);
    }

    const users = data.users || [];
    const found = users.find((user) => String(user.email || '').toLowerCase() === normalized);

    if (found) {
      return found;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function ensureDefaultAdmin() {
  loadEnv();
  const { supabaseUrl, serviceRoleKey } = getSupabaseAdminEnv();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', DEFAULT_USERNAME)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Failed to query profiles: ${profileError.message}`);
  }

  let userId = profile?.id || null;

  if (!userId) {
    const existingUser = await findAuthUserByEmail(supabase, DEFAULT_EMAIL);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: DEFAULT_EMAIL,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          username: DEFAULT_USERNAME,
          full_name: 'Administrator',
        },
      });

      if (createError || !created.user?.id) {
        throw new Error(createError?.message || 'Failed to create default admin user.');
      }

      userId = created.user.id;
    }
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: {
      username: DEFAULT_USERNAME,
      full_name: 'Administrator',
    },
  });

  if (updateError) {
    throw new Error(`Failed to update default admin credentials: ${updateError.message}`);
  }

  const { error: upsertProfileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        username: DEFAULT_USERNAME,
        full_name: 'Administrator',
        goal: 15,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  if (upsertProfileError) {
    throw new Error(`Failed to upsert admin profile: ${upsertProfileError.message}`);
  }

  console.log('Default admin ready: username=admin, password=123456');
}

ensureDefaultAdmin().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
