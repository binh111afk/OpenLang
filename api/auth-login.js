const { createClient } = require('@supabase/supabase-js');
const { createSupabaseAdminClient } = require('./_lib/supabase');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

function createSupabaseAnonClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase URL or anon key for auth login.');
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

module.exports = async (req, res) => {
  if (withCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return allowMethods(res, ['POST', 'OPTIONS']);
  }

  try {
    const payload = await readJsonBody(req);
    const username = normalizeUsername(payload.username);
    const password = String(payload.password || '');

    if (!username || !password) {
      return sendJson(res, 400, {
        error: 'Missing username or password.',
      });
    }

    const adminClient = createSupabaseAdminClient();

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .maybeSingle();

    if (profileError) {
      return sendJson(res, 500, { error: profileError.message });
    }

    if (!profile?.id) {
      return sendJson(res, 401, { error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    const { data: authUserData, error: authUserError } = await adminClient.auth.admin.getUserById(profile.id);

    if (authUserError || !authUserData.user?.email) {
      return sendJson(res, 401, { error: 'Tài khoản không hợp lệ.' });
    }

    const anonClient = createSupabaseAnonClient();
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: authUserData.user.email,
      password,
    });

    if (signInError || !signInData.session || !signInData.user) {
      return sendJson(res, 401, { error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    return sendJson(res, 200, {
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
      user: {
        id: signInData.user.id,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_JSON') {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown server error.',
    });
  }
};
