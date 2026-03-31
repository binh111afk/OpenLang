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
    throw new Error('Missing Supabase URL or anon key for auth endpoints.');
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

function readAction(req) {
  const raw = req.query?.action;
  const action = Array.isArray(raw) ? raw[0] : raw;
  return String(action || '').trim().toLowerCase();
}

async function handleLogin(payload) {
  const username = normalizeUsername(payload.username);
  const password = String(payload.password || '');

  if (!username || !password) {
    return {
      status: 400,
      body: { error: 'Missing username or password.' },
    };
  }

  const adminClient = createSupabaseAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .maybeSingle();

  if (profileError) {
    return {
      status: 500,
      body: { error: profileError.message },
    };
  }

  if (!profile?.id) {
    return {
      status: 401,
      body: { error: 'Tên đăng nhập hoặc mật khẩu không đúng.' },
    };
  }

  const { data: authUserData, error: authUserError } = await adminClient.auth.admin.getUserById(profile.id);

  if (authUserError || !authUserData.user?.email) {
    return {
      status: 401,
      body: { error: 'Tài khoản không hợp lệ.' },
    };
  }

  const anonClient = createSupabaseAnonClient();
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: authUserData.user.email,
    password,
  });

  if (signInError || !signInData.session || !signInData.user) {
    return {
      status: 401,
      body: { error: 'Tên đăng nhập hoặc mật khẩu không đúng.' },
    };
  }

  const fullNameFromMeta =
    typeof signInData.user.user_metadata?.full_name === 'string'
      ? signInData.user.user_metadata.full_name
      : null;

  const { error: ensureProfileError } = await adminClient
    .from('profiles')
    .upsert(
      {
        id: signInData.user.id,
        username,
        full_name: fullNameFromMeta || username,
        goal: 15,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  if (ensureProfileError) {
    return {
      status: 500,
      body: { error: ensureProfileError.message },
    };
  }

  return {
    status: 200,
    body: {
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
      user: {
        id: signInData.user.id,
      },
    },
  };
}

async function handleRegister(payload) {
  const username = normalizeUsername(payload.username);
  const password = String(payload.password || '');
  const email = String(payload.email || '').trim().toLowerCase();
  const fullName = String(payload.fullName || '').trim();

  if (!username || !password || !email || !fullName) {
    return {
      status: 400,
      body: { error: 'Missing registration fields.' },
    };
  }

  if (password.length < 6) {
    return {
      status: 400,
      body: { error: 'Mật khẩu phải có ít nhất 6 ký tự.' },
    };
  }

  const adminClient = createSupabaseAdminClient();

  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existingProfileError) {
    return {
      status: 500,
      body: { error: existingProfileError.message },
    };
  }

  if (existingProfile?.id) {
    return {
      status: 409,
      body: { error: 'Tên đăng nhập đã tồn tại.' },
    };
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
      return {
        status: 409,
        body: { error: 'Email đã được sử dụng.' },
      };
    }

    return {
      status: 400,
      body: { error: message },
    };
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
    return {
      status: 500,
      body: { error: upsertProfileError.message },
    };
  }

  const anonClient = createSupabaseAnonClient();
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session || !signInData.user) {
    return {
      status: 201,
      body: {
        created: true,
        requiresManualLogin: true,
      },
    };
  }

  return {
    status: 201,
    body: {
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
      user: {
        id: signInData.user.id,
      },
    },
  };
}

module.exports = async (req, res) => {
  if (withCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return allowMethods(res, ['POST', 'OPTIONS']);
  }

  try {
    const action = readAction(req);
    const payload = await readJsonBody(req);

    let result;

    if (action === 'register') {
      result = await handleRegister(payload);
    } else {
      result = await handleLogin(payload);
    }

    return sendJson(res, result.status, result.body);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_JSON') {
      return sendJson(res, 400, { error: 'Invalid JSON body.' });
    }

    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown server error.',
    });
  }
};
