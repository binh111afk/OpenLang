const { createSupabaseAdminClient } = require('./_lib/supabase');
const { allowMethods, readJsonBody, sendJson, withCors } = require('./_lib/http');

function readBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== 'string') {
    return null;
  }

  const [type, token] = header.split(' ');
  if (type?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

async function getAuthenticatedUser(supabase, req) {
  const token = readBearerToken(req);

  if (!token) {
    return { user: null, error: 'Missing bearer token.' };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: 'Invalid or expired auth token.' };
  }

  return { user: data.user, error: null };
}

module.exports = async (req, res) => {
  if (withCors(req, res)) {
    return;
  }

  if (!['GET', 'PUT'].includes(req.method)) {
    return allowMethods(res, ['GET', 'PUT', 'OPTIONS']);
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase, req);

    if (authError || !user) {
      return sendJson(res, 401, { error: authError || 'Unauthorized.' });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, goal')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        return sendJson(res, 500, { error: error.message });
      }

      return sendJson(res, 200, {
        profile: data || null,
      });
    }

    const payload = await readJsonBody(req);
    const nextProfile = {
      id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (payload.username !== undefined) {
      nextProfile.username = normalizeUsername(payload.username);
    }

    if (payload.fullName !== undefined) {
      nextProfile.full_name = String(payload.fullName || '').trim() || null;
    }

    if (payload.avatarUrl !== undefined) {
      nextProfile.avatar_url = payload.avatarUrl || null;
    }

    if (payload.goal !== undefined) {
      nextProfile.goal = Math.max(1, Math.round(Number(payload.goal) || 1));
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(nextProfile, { onConflict: 'id' })
      .select('id, username, full_name, avatar_url, goal')
      .single();

    if (error) {
      if (error.code === '23505' && String(error.message || '').includes('username')) {
        return sendJson(res, 409, { error: 'Tên đăng nhập đã tồn tại.' });
      }

      return sendJson(res, 500, { error: error.message });
    }

    return sendJson(res, 200, {
      profile: data,
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
