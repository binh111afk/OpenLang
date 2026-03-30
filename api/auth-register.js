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
    throw new Error('Missing Supabase URL or anon key for auth register.');
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
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
    const email = String(payload.email || '').trim().toLowerCase();
    const fullName = String(payload.fullName || '').trim();

    if (!username || !password || !email || !fullName) {
      return sendJson(res, 400, { error: 'Missing registration fields.' });
    }

    if (password.length < 6) {
      return sendJson(res, 400, { error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    const adminClient = createSupabaseAdminClient();

    const { data: existingProfile, error: existingProfileError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingProfileError) {
      return sendJson(res, 500, { error: existingProfileError.message });
    }

    if (existingProfile?.id) {
      return sendJson(res, 409, { error: 'Tên đăng nhập đã tồn tại.' });
    }

    const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name: fullName,
      },
    });

    if (createUserError || !createdUserData.user?.id) {
      const message = createUserError?.message || 'Không thể tạo tài khoản.';
      if (String(message).toLowerCase().includes('already')) {
        return sendJson(res, 409, { error: 'Email đã được sử dụng.' });
      }
      return sendJson(res, 400, { error: message });
    }

    const userId = createdUserData.user.id;

    const { error: upsertProfileError } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: userId,
          username,
          full_name: fullName,
          goal: 15,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

    if (upsertProfileError) {
      return sendJson(res, 500, { error: upsertProfileError.message });
    }

    const anonClient = createSupabaseAnonClient();
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session || !signInData.user) {
      return sendJson(res, 201, {
        created: true,
        requiresManualLogin: true,
      });
    }

    return sendJson(res, 201, {
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
